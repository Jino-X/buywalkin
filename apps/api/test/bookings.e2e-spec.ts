import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Bookings (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let customer2Token: string;
  let ownerToken: string;
  let serviceId: string;
  let businessId: string;

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

    const customer2Res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Customer 2',
        email: 'customer2@test.com',
        password: 'Password123!',
        role: 'CUSTOMER',
      });
    customer2Token = customer2Res.body.accessToken;

    const ownerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Owner',
        email: 'owner@test.com',
        password: 'Password123!',
        role: 'BUSINESS_OWNER',
      });
    ownerToken = ownerRes.body.accessToken;

    const businessRes = await request(app.getHttpServer())
      .post('/api/v1/businesses')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Test Business',
        description: 'Test',
      });
    businessId = businessRes.body.id;

    await request(app.getHttpServer())
      .put('/api/v1/businesses/me/operating-hours')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        hours: [
          {
            dayOfWeek: 'MONDAY',
            openingTime: '09:00',
            closingTime: '18:00',
          },
          {
            dayOfWeek: 'TUESDAY',
            openingTime: '09:00',
            closingTime: '18:00',
          },
          {
            dayOfWeek: 'WEDNESDAY',
            openingTime: '09:00',
            closingTime: '18:00',
          },
          {
            dayOfWeek: 'THURSDAY',
            openingTime: '09:00',
            closingTime: '18:00',
          },
          {
            dayOfWeek: 'FRIDAY',
            openingTime: '09:00',
            closingTime: '18:00',
          },
        ],
      });

    const serviceRes = await request(app.getHttpServer())
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Test Service',
        description: 'Test',
        price: 100,
        durationMinutes: 60,
      });
    serviceId = serviceRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Availability', () => {
    it('should generate valid slots based on operating hours', async () => {
      const nextMonday = getNextDayOfWeek(1);
      const dateStr = nextMonday.toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .get(`/api/v1/services/${serviceId}/availability?date=${dateStr}`)
        .expect(200);

      expect(res.body.slots).toBeDefined();
      expect(res.body.slots.length).toBe(9);
      expect(res.body.slots[0].startTime).toBe('09:00');
      expect(res.body.slots[0].endTime).toBe('10:00');
      expect(res.body.slots[8].startTime).toBe('17:00');
      expect(res.body.slots[8].endTime).toBe('18:00');
    });

    it('should respect service duration', async () => {
      const service90Res = await request(app.getHttpServer())
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: '90 Min Service',
          description: 'Test',
          price: 150,
          durationMinutes: 90,
        });

      const nextMonday = getNextDayOfWeek(1);
      const dateStr = nextMonday.toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .get(`/api/v1/services/${service90Res.body.id}/availability?date=${dateStr}`)
        .expect(200);

      expect(res.body.slots.length).toBe(6);
      expect(res.body.slots[0].endTime).toBe('10:30');
    });

    it('should not exceed closing time', async () => {
      const nextMonday = getNextDayOfWeek(1);
      const dateStr = nextMonday.toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .get(`/api/v1/services/${serviceId}/availability?date=${dateStr}`)
        .expect(200);

      const lastSlot = res.body.slots[res.body.slots.length - 1];
      expect(lastSlot.endTime).toBe('18:00');
    });

    it('should return empty slots for closed days', async () => {
      const nextSunday = getNextDayOfWeek(0);
      const dateStr = nextSunday.toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .get(`/api/v1/services/${serviceId}/availability?date=${dateStr}`)
        .expect(200);

      expect(res.body.slots.length).toBe(0);
      expect(res.body.message).toContain('closed');
    });

    it('should mark booked slots as unavailable', async () => {
      const nextMonday = getNextDayOfWeek(1);
      nextMonday.setHours(10, 0, 0, 0);

      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          startTime: nextMonday.toISOString(),
        })
        .expect(201);

      const dateStr = nextMonday.toISOString().split('T')[0];
      const res = await request(app.getHttpServer())
        .get(`/api/v1/services/${serviceId}/availability?date=${dateStr}`)
        .expect(200);

      const slot10 = res.body.slots.find((s: any) => s.startTime === '10:00');
      expect(slot10.available).toBe(false);
    });

    it('should show cancelled slots as available', async () => {
      const nextMonday = getNextDayOfWeek(1);
      nextMonday.setHours(11, 0, 0, 0);

      const bookingRes = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          startTime: nextMonday.toISOString(),
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const dateStr = nextMonday.toISOString().split('T')[0];
      const res = await request(app.getHttpServer())
        .get(`/api/v1/services/${serviceId}/availability?date=${dateStr}`)
        .expect(200);

      const slot11 = res.body.slots.find((s: any) => s.startTime === '11:00');
      expect(slot11.available).toBe(true);
    });

    it('should reject past dates', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      return request(app.getHttpServer())
        .get(`/api/v1/services/${serviceId}/availability?date=${dateStr}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('past');
        });
    });
  });

  describe('Booking Creation', () => {
    it('should create booking successfully for valid slot', async () => {
      const nextMonday = getNextDayOfWeek(1);
      nextMonday.setHours(14, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          startTime: nextMonday.toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('CONFIRMED');
          expect(res.body.service.id).toBe(serviceId);
        });
    });

    it('should reject booking for past slot', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(10, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          startTime: yesterday.toISOString(),
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('past');
        });
    });

    it('should reject booking outside operating hours (before opening)', async () => {
      const nextMonday = getNextDayOfWeek(1);
      nextMonday.setHours(8, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          startTime: nextMonday.toISOString(),
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('operating hours');
        });
    });

    it('should reject booking outside operating hours (after closing)', async () => {
      const nextMonday = getNextDayOfWeek(1);
      nextMonday.setHours(17, 30, 0, 0);

      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          startTime: nextMonday.toISOString(),
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('operating hours');
        });
    });

    it('should reject booking on closed day', async () => {
      const nextSunday = getNextDayOfWeek(0);
      nextSunday.setHours(10, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          startTime: nextSunday.toISOString(),
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('closed');
        });
    });

    it('should reject booking for non-existent service', async () => {
      const nextMonday = getNextDayOfWeek(1);
      nextMonday.setHours(10, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId: '00000000-0000-0000-0000-000000000000',
          startTime: nextMonday.toISOString(),
        })
        .expect(404);
    });

    it('should reject invalid slot time (half-hour for hourly service)', async () => {
      const nextMonday = getNextDayOfWeek(1);
      nextMonday.setHours(10, 30, 0, 0);

      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          startTime: nextMonday.toISOString(),
        })
        .expect(400);
    });
  });

  describe('Concurrent Booking (CRITICAL TEST)', () => {
    it('should allow only one booking for the same slot when two requests are made simultaneously', async () => {
      const nextMonday = getNextDayOfWeek(1);
      nextMonday.setHours(15, 0, 0, 0);
      const startTime = nextMonday.toISOString();

      const [result1, result2] = await Promise.allSettled([
        request(app.getHttpServer())
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            serviceId,
            startTime,
          }),
        request(app.getHttpServer())
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${customer2Token}`)
          .send({
            serviceId,
            startTime,
          }),
      ]);

      const responses = [
        result1.status === 'fulfilled' ? result1.value : null,
        result2.status === 'fulfilled' ? result2.value : null,
      ].filter(Boolean);

      const successCount = responses.filter((r) => r.status === 201).length;
      const conflictCount = responses.filter((r) => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(1);

      const conflictResponse = responses.find((r) => r.status === 409);
      expect(conflictResponse.body.message).toContain('no longer available');

      const bookings = await prisma.booking.findMany({
        where: {
          serviceId,
          startTime: nextMonday,
          status: 'CONFIRMED',
        },
      });

      expect(bookings.length).toBe(1);
    });

    it('should handle three concurrent requests correctly', async () => {
      const nextTuesday = getNextDayOfWeek(2);
      nextTuesday.setHours(11, 0, 0, 0);
      const startTime = nextTuesday.toISOString();

      const customer3Res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Customer 3',
          email: 'customer3@test.com',
          password: 'Password123!',
          role: 'CUSTOMER',
        });
      const customer3Token = customer3Res.body.accessToken;

      const results = await Promise.allSettled([
        request(app.getHttpServer())
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ serviceId, startTime }),
        request(app.getHttpServer())
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${customer2Token}`)
          .send({ serviceId, startTime }),
        request(app.getHttpServer())
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${customer3Token}`)
          .send({ serviceId, startTime }),
      ]);

      const responses = results
        .filter((r) => r.status === 'fulfilled')
        .map((r: any) => r.value);

      const successCount = responses.filter((r) => r.status === 201).length;
      const conflictCount = responses.filter((r) => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(2);

      const bookings = await prisma.booking.findMany({
        where: {
          serviceId,
          startTime: nextTuesday,
          status: 'CONFIRMED',
        },
      });

      expect(bookings.length).toBe(1);
    });
  });

  describe('Booking Cancellation', () => {
    let bookingId: string;

    beforeEach(async () => {
      const nextWednesday = getNextDayOfWeek(3);
      nextWednesday.setHours(13, 0, 0, 0);

      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          startTime: nextWednesday.toISOString(),
        });
      bookingId = res.body.id;
    });

    it('should cancel booking successfully', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('CANCELLED');
        });
    });

    it('should reject cancelling already cancelled booking', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      return request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('already cancelled');
        });
    });

    it('should reject customer cancelling another customers booking', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .expect(403);
    });

    it('should make slot available again after cancellation', async () => {
      const nextWednesday = getNextDayOfWeek(3);
      nextWednesday.setHours(13, 0, 0, 0);
      const dateStr = nextWednesday.toISOString().split('T')[0];

      let res = await request(app.getHttpServer())
        .get(`/api/v1/services/${serviceId}/availability?date=${dateStr}`)
        .expect(200);

      let slot13 = res.body.slots.find((s: any) => s.startTime === '13:00');
      expect(slot13.available).toBe(false);

      await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      res = await request(app.getHttpServer())
        .get(`/api/v1/services/${serviceId}/availability?date=${dateStr}`)
        .expect(200);

      slot13 = res.body.slots.find((s: any) => s.startTime === '13:00');
      expect(slot13.available).toBe(true);
    });

    it('should allow another customer to book cancelled slot', async () => {
      const nextWednesday = getNextDayOfWeek(3);
      nextWednesday.setHours(13, 0, 0, 0);

      await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          serviceId,
          startTime: nextWednesday.toISOString(),
        })
        .expect(201);
    });
  });

  describe('My Bookings', () => {
    it('should return only customers own bookings', async () => {
      const nextThursday = getNextDayOfWeek(4);
      nextThursday.setHours(10, 0, 0, 0);

      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          startTime: nextThursday.toISOString(),
        });

      nextThursday.setHours(11, 0, 0, 0);
      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          serviceId,
          startTime: nextThursday.toISOString(),
        });

      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings/my-bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.length).toBe(1);
    });

    it('should filter bookings by status', async () => {
      const nextFriday = getNextDayOfWeek(5);
      nextFriday.setHours(10, 0, 0, 0);

      const booking1 = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          startTime: nextFriday.toISOString(),
        });

      nextFriday.setHours(11, 0, 0, 0);
      const booking2 = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          startTime: nextFriday.toISOString(),
        });

      await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${booking2.body.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      const confirmedRes = await request(app.getHttpServer())
        .get('/api/v1/bookings/my-bookings?status=CONFIRMED')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(confirmedRes.body.length).toBe(1);
      expect(confirmedRes.body[0].status).toBe('CONFIRMED');

      const cancelledRes = await request(app.getHttpServer())
        .get('/api/v1/bookings/my-bookings?status=CANCELLED')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(cancelledRes.body.length).toBe(1);
      expect(cancelledRes.body[0].status).toBe('CANCELLED');
    });
  });
});

function getNextDayOfWeek(dayOfWeek: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + ((7 + dayOfWeek - date.getDay()) % 7 || 7));
  date.setHours(0, 0, 0, 0);
  return date;
}
