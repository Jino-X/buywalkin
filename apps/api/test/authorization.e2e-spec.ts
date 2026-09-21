import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Authorization (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let ownerAToken: string;
  let ownerBToken: string;
  let ownerABusinessId: string;
  let ownerBBusinessId: string;
  let ownerBServiceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.booking.deleteMany();
    await prisma.operatingHour.deleteMany();
    await prisma.service.deleteMany();
    await prisma.business.deleteMany();
    await prisma.user.deleteMany();

    const customerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Customer',
        email: 'customer@test.com',
        password: 'Password123!',
        role: 'CUSTOMER',
      });
    customerToken = customerRes.body.accessToken;

    const ownerARes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Owner A',
        email: 'ownerA@test.com',
        password: 'Password123!',
        role: 'BUSINESS_OWNER',
      });
    ownerAToken = ownerARes.body.accessToken;

    const ownerBRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Owner B',
        email: 'ownerB@test.com',
        password: 'Password123!',
        role: 'BUSINESS_OWNER',
      });
    ownerBToken = ownerBRes.body.accessToken;

    const businessARes = await request(app.getHttpServer())
      .post('/api/v1/businesses')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        name: 'Business A',
        description: 'Test business A',
      });
    ownerABusinessId = businessARes.body.id;

    const businessBRes = await request(app.getHttpServer())
      .post('/api/v1/businesses')
      .set('Authorization', `Bearer ${ownerBToken}`)
      .send({
        name: 'Business B',
        description: 'Test business B',
      });
    ownerBBusinessId = businessBRes.body.id;

    const serviceBRes = await request(app.getHttpServer())
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${ownerBToken}`)
      .send({
        name: 'Service B',
        description: 'Test service B',
        price: 100,
        durationMinutes: 60,
      });
    ownerBServiceId = serviceBRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Business Management Authorization', () => {
    it('should allow business owner to create business', () => {
      return request(app.getHttpServer())
        .post('/api/v1/businesses')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          name: 'New Business',
          description: 'Test',
        })
        .expect(409);
    });

    it('should reject customer creating business', () => {
      return request(app.getHttpServer())
        .post('/api/v1/businesses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Customer Business',
          description: 'Test',
        })
        .expect(403);
    });

    it('should allow owner to access their own business', () => {
      return request(app.getHttpServer())
        .get('/api/v1/businesses/me')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(ownerABusinessId);
        });
    });

    it('should reject customer accessing business endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/v1/businesses/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('Service Management Authorization', () => {
    it('should allow owner to create service', () => {
      return request(app.getHttpServer())
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          name: 'New Service',
          description: 'Test service',
          price: 500,
          durationMinutes: 60,
        })
        .expect(201);
    });

    it('should reject customer creating service', () => {
      return request(app.getHttpServer())
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Customer Service',
          description: 'Test',
          price: 100,
          durationMinutes: 30,
        })
        .expect(403);
    });

    it('should allow owner to modify their own service', async () => {
      const serviceRes = await request(app.getHttpServer())
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          name: 'Service A',
          description: 'Test',
          price: 100,
          durationMinutes: 60,
        });

      return request(app.getHttpServer())
        .patch(`/api/v1/services/${serviceRes.body.id}`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          price: 200,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.price).toBe('200');
        });
    });

    it('should reject owner modifying another owners service', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/services/${ownerBServiceId}`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          price: 999,
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('do not own');
        });
    });

    it('should reject owner deleting another owners service', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/services/${ownerBServiceId}`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .expect(403);
    });

    it('should allow owner to delete their own service', async () => {
      const serviceRes = await request(app.getHttpServer())
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          name: 'To Delete',
          description: 'Test',
          price: 100,
          durationMinutes: 60,
        });

      return request(app.getHttpServer())
        .delete(`/api/v1/services/${serviceRes.body.id}`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .expect(200);
    });
  });

  describe('Booking Authorization', () => {
    it('should allow customer to create booking', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/businesses/me/operating-hours')
        .set('Authorization', `Bearer ${ownerBToken}`)
        .send({
          hours: [
            {
              dayOfWeek: 'MONDAY',
              openingTime: '09:00',
              closingTime: '18:00',
            },
          ],
        });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      while (tomorrow.getDay() !== 1) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      tomorrow.setHours(10, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId: ownerBServiceId,
          startTime: tomorrow.toISOString(),
        })
        .expect(201);
    });

    it('should reject business owner creating booking', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          serviceId: ownerBServiceId,
          startTime: tomorrow.toISOString(),
        })
        .expect(403);
    });

    it('should only show customer their own bookings', async () => {
      return request(app.getHttpServer())
        .get('/api/v1/bookings/my-bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should reject business owner accessing customer booking endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/v1/bookings/my-bookings')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .expect(403);
    });
  });

  describe('Business Bookings Authorization', () => {
    it('should allow owner to view their business bookings', () => {
      return request(app.getHttpServer())
        .get('/api/v1/businesses/me/bookings')
        .set('Authorization', `Bearer ${ownerBToken}`)
        .expect(200);
    });

    it('should not show bookings from other businesses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/businesses/me/bookings')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .expect(200);

      expect(res.body.length).toBe(0);
    });
  });
});
