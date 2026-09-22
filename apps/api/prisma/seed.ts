import { PrismaClient, UserRole, DayOfWeek, BookingStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'customer@example.com',
      passwordHash,
      role: UserRole.CUSTOMER,
    },
  });

  console.log('Created customer:', customer.email);

  const businessOwner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      name: 'Business Owner',
      email: 'owner@example.com',
      passwordHash,
      role: UserRole.BUSINESS_OWNER,
    },
  });

  console.log('Created business owner:', businessOwner.email);

  const business = await prisma.business.upsert({
    where: { ownerId: businessOwner.id },
    update: {},
    create: {
      ownerId: businessOwner.id,
      name: 'ABC Wellness',
      description: 'Premium wellness and spa services',
    },
  });

  console.log('Created business:', business.name);

  const operatingHours = [
    { dayOfWeek: DayOfWeek.MONDAY, openingTime: '09:00', closingTime: '18:00' },
    { dayOfWeek: DayOfWeek.TUESDAY, openingTime: '09:00', closingTime: '18:00' },
    { dayOfWeek: DayOfWeek.WEDNESDAY, openingTime: '09:00', closingTime: '18:00' },
    { dayOfWeek: DayOfWeek.THURSDAY, openingTime: '09:00', closingTime: '18:00' },
    { dayOfWeek: DayOfWeek.FRIDAY, openingTime: '09:00', closingTime: '18:00' },
    { dayOfWeek: DayOfWeek.SATURDAY, openingTime: '10:00', closingTime: '14:00' },
  ];

  for (const hours of operatingHours) {
    await prisma.operatingHour.upsert({
      where: {
        businessId_dayOfWeek: {
          businessId: business.id,
          dayOfWeek: hours.dayOfWeek,
        },
      },
      update: {},
      create: {
        businessId: business.id,
        ...hours,
      },
    });
  }

  console.log('Created operating hours');

  const services = [
    {
      name: 'Professional Haircut',
      description: 'Expert haircut with styling consultation',
      price: 500,
      durationMinutes: 60,
    },
    {
      name: 'Deep Tissue Massage',
      description: 'Therapeutic massage for muscle tension relief',
      price: 1200,
      durationMinutes: 90,
    },
    {
      name: 'Facial Treatment',
      description: 'Rejuvenating facial with premium products',
      price: 800,
      durationMinutes: 60,
    },
    {
      name: 'Manicure & Pedicure',
      description: 'Complete nail care and grooming',
      price: 600,
      durationMinutes: 45,
    },
    {
      name: 'Yoga Session',
      description: 'Personalized yoga instruction',
      price: 400,
      durationMinutes: 60,
    },
  ];

  const createdServices = [];
  for (const serviceData of services) {
    const service = await prisma.service.upsert({
      where: {
        id: `seed-${serviceData.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        id: `seed-${serviceData.name.toLowerCase().replace(/\s+/g, '-')}`,
        businessId: business.id,
        ...serviceData,
      },
    });
    createdServices.push(service);
  }

  console.log(`Created ${createdServices.length} services`);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setHours(15, 0, 0, 0);

  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setHours(10, 0, 0, 0);

  const lastWeekEnd = new Date(lastWeek);
  lastWeekEnd.setHours(11, 0, 0, 0);

  const seedBooking = async (
    serviceId: string,
    startTime: Date,
    endTime: Date,
    status: BookingStatus,
  ) => {
    const existing = await prisma.booking.findFirst({
      where: { serviceId, startTime, status },
    });
    if (!existing) {
      await prisma.booking.create({
        data: { serviceId, customerId: customer.id, startTime, endTime, status },
      });
    }
  };

  await seedBooking(createdServices[0].id, tomorrow, tomorrowEnd, BookingStatus.CONFIRMED);
  await seedBooking(createdServices[1].id, nextWeek, nextWeekEnd, BookingStatus.CONFIRMED);
  await seedBooking(createdServices[2].id, lastWeek, lastWeekEnd, BookingStatus.CANCELLED);

  console.log('Created sample bookings');
  console.log('Seed completed successfully!');
  console.log('\nTest credentials:');
  console.log('Customer: customer@example.com / Password123!');
  console.log('Business Owner: owner@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
