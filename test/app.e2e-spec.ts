import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { Kysely, sql } from 'kysely';
import { type MigrationProvider, Migrator } from 'kysely/migration';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { createDatabase } from '../src/database/create-database.js';
import * as createUsersMigration from '../src/database/migrations/001_create_users.js';
import * as addDeletedAtMigration from '../src/database/migrations/002_add_deleted_at_to_users.js';
import type { Database } from '../src/types.js';

const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return {
      '001_create_users': createUsersMigration,
      '002_add_deleted_at_to_users': addDeletedAtMigration,
    };
  },
};

const testUser = (name: string) => ({
  login: name,
  email: `${name}@example.com`,
  password: 'strong-password',
  age: 25,
  description: `Профиль ${name}`,
});

function getRefreshCookie(response: import('supertest').Response): string {
  const setCookie = response.headers['set-cookie'];
  const rawCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;

  if (!rawCookie) {
    throw new Error('Ответ не содержит refreshToken cookie');
  }

  return rawCookie.split(';', 1)[0];
}

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let db: Kysely<Database>;

  beforeAll(async () => {
    db = createDatabase({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      statement_timeout: Number(process.env.POSTGRES_STATEMENT_TIMEOUT_MS),
      max: 5,
    });

    const migrator = new Migrator({
      db,
      provider: migrationProvider,
    });
    const migrationResult = await migrator.migrateToLatest();

    if (migrationResult.error) {
      throw migrationResult.error;
    }

    const { AppModule } = await import('../src/app.module.js');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.use(cookieParser());
    await app.init();
  });

  beforeEach(async () => {
    await sql`truncate table users restart identity cascade`.execute(db);
  });

  afterAll(async () => {
    await app?.close();
    await db?.destroy();
  });

  it('регистрирует пользователя и выполняет вход', async () => {
    const user = testUser('alice');
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);

    expect(registration.body).toEqual({ accessToken: expect.any(String) });
    expect(getRefreshCookie(registration)).toMatch(/^refreshToken=.+/);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: user.login, password: user.password })
      .expect(201);

    expect(login.body).toEqual({ accessToken: expect.any(String) });
    expect(getRefreshCookie(login)).toMatch(/^refreshToken=.+/);
  });

  it('защищает роут от истёкшего и невалидного access-токена', async () => {
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser('secured'))
      .expect(201);

    await request(app.getHttpServer())
      .get('/profile/my')
      .set('Authorization', `Bearer ${registration.body.accessToken}`)
      .expect(200);

    const expiredToken = await new JwtService().signAsync(
      { sub: 1, token: 'access_token' },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: -1,
      },
    );

    await request(app.getHttpServer())
      .get('/profile/my')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .get('/profile/my')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('обновляет пару токенов и отклоняет повторное использование старого refresh', async () => {
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser('rotation'))
      .expect(201);
    const oldRefreshCookie = getRefreshCookie(registration);

    const refresh = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', oldRefreshCookie)
      .expect(201);

    expect(refresh.body).toEqual({ accessToken: expect.any(String) });
    expect(getRefreshCookie(refresh)).not.toBe(oldRefreshCookie);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', oldRefreshCookie)
      .expect(401);
  });

  it('возвращает свой профиль, страницу пользователей и фильтр по логину', async () => {
    const alpha = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser('alpha'))
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser('beta'))
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser('alphabet'))
      .expect(201);

    const authorization = `Bearer ${alpha.body.accessToken}`;
    const profile = await request(app.getHttpServer())
      .get('/profile/my')
      .set('Authorization', authorization)
      .expect(200);

    expect(profile.body).toMatchObject({
      login: 'alpha',
      email: 'alpha@example.com',
    });
    expect(profile.body).not.toHaveProperty('password_hash');
    expect(profile.body).not.toHaveProperty('refresh_token_hash');

    const secondPage = await request(app.getHttpServer())
      .get('/profile/list?page=2&limit=2')
      .set('Authorization', authorization)
      .expect(200);

    expect(
      secondPage.body.map((user: { login: string }) => user.login),
    ).toEqual(['alphabet']);

    const filtered = await request(app.getHttpServer())
      .get('/profile/list?login=alp')
      .set('Authorization', authorization)
      .expect(200);

    expect(filtered.body.map((user: { login: string }) => user.login)).toEqual([
      'alpha',
      'alphabet',
    ]);
  });

  it('обновляет и мягко удаляет только свой профиль', async () => {
    const deletedUser = testUser('deleted-user');
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send(deletedUser)
      .expect(201);
    const refreshCookie = getRefreshCookie(registration);
    const authorization = `Bearer ${registration.body.accessToken}`;

    const update = await request(app.getHttpServer())
      .patch('/profile/update')
      .set('Authorization', authorization)
      .send({ login: 'updated-user', description: 'Обновлённый профиль' })
      .expect(200);

    expect(update.body).toMatchObject({
      login: 'updated-user',
      description: 'Обновлённый профиль',
    });

    await request(app.getHttpServer())
      .delete('/profile/delete')
      .set('Authorization', authorization)
      .expect(200);

    const row = await db
      .selectFrom('users')
      .select(['deleted_at', 'refresh_token_hash'])
      .where('id', '=', 1)
      .executeTakeFirstOrThrow();

    expect(row.deleted_at).not.toBeNull();
    expect(row.refresh_token_hash).toBeNull();

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: 'updated-user', password: deletedUser.password })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);

    const activeUser = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser('active-user'))
      .expect(201);
    const profiles = await request(app.getHttpServer())
      .get('/profile/list')
      .set('Authorization', `Bearer ${activeUser.body.accessToken}`)
      .expect(200);

    expect(profiles.body.map((user: { login: string }) => user.login)).toEqual([
      'active-user',
    ]);
  });
});
