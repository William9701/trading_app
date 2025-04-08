import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as fs from 'fs';
import { AppModule } from '../src/app.module'; // Ensure this imports the correct module

describe('Auth and Wallet Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],  // Make sure the AppModule contains all your necessary modules
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should register successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'obi_william@yahoo.com',
        password: 'Password123!',
        role: 'admin',
      })
      .expect(201);

    expect(response.body).toHaveProperty('email', 'obi_william@yahoo.com');
  });

  it('should verify email successfully', async () => {
    // Assuming an OTP is sent to the user's email, here we're sending the OTP to verify the user
    const response = await request(app.getHttpServer())
      .post('/auth/verify')
      .send({
        email: 'obi_william@yahoo.com',
        otp: '880076',  // Use the actual OTP that your system generates
      })
      .expect(200);

    expect(response.body).toHaveProperty('message', 'User verified successfully');
  });

  it('should login successfully', async () => {
    // Perform login after registration and verification
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'obi_william@yahoo.com',
        password: 'Password123!',
      })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    fs.writeFileSync('cookies.txt', JSON.stringify(response.headers['set-cookie']));  // Save cookies for the next requests
  });

  it('should fetch wallet details successfully', async () => {
    const cookies = fs.readFileSync('cookies.txt', 'utf-8');  // Read the cookies saved from login
    const response = await request(app.getHttpServer())
      .get('/wallet')
      .set('Cookie', cookies)  // Pass cookies for authentication
      .expect(200);

    expect(response.body).toHaveProperty('balance');
  });

  it('should fund wallet successfully', async () => {
    const cookies = fs.readFileSync('cookies.txt', 'utf-8');  // Read the cookies saved from login
    const response = await request(app.getHttpServer())
      .post('/wallet/fund')
      .set('Cookie', cookies)  // Pass cookies for authentication
      .send({ currency: 'USD', amount: 32000 })
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Funded successfully');
  });

  it('should convert currency successfully', async () => {
    const cookies = fs.readFileSync('cookies.txt', 'utf-8');  // Read the cookies saved from login
    const response = await request(app.getHttpServer())
      .post('/wallet/convert')
      .set('Cookie', cookies)  // Pass cookies for authentication
      .send({
        fromCurrency: 'USD',
        toCurrency: 'NGN',
        amount: 1000,
      })
      .expect(200);

    expect(response.body).toHaveProperty('convertedAmount');
  });

  it('should trade currency successfully', async () => {
    const cookies = fs.readFileSync('cookies.txt', 'utf-8');  // Read the cookies saved from login
    const response = await request(app.getHttpServer())
      .post('/wallet/trade')
      .set('Cookie', cookies)  // Pass cookies for authentication
      .send({
        fromCurrency: 'NGN',
        toCurrency: 'USD',
        amount: 152906,
      })
      .expect(200);

    expect(response.body).toHaveProperty('tradeConfirmation');
  });

  it('should get FX rates successfully', async () => {
    const cookies = fs.readFileSync('cookies.txt', 'utf-8');  // Read the cookies saved from login
    const response = await request(app.getHttpServer())
      .get('/fx/rates')
      .set('Cookie', cookies)  // Pass cookies for authentication
      .expect(200);

    expect(response.body).toHaveProperty('rates');
  });

  it('should get transactions successfully', async () => {
    const cookies = fs.readFileSync('cookies.txt', 'utf-8');  // Read the cookies saved from login
    const response = await request(app.getHttpServer())
      .get('/transactions')
      .set('Cookie', cookies)  // Pass cookies for authentication
      .expect(200);

    expect(response.body).toHaveProperty('transactions');
  });

  it('should logout successfully', async () => {
    const cookies = fs.readFileSync('cookies.txt', 'utf-8');  // Read the cookies saved from login
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookies)  // Pass cookies for authentication
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Logout successful');
  });

  afterAll(async () => {
    await app.close();
  });
});
