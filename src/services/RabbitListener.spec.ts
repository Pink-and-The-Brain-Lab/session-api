import jwt from 'jsonwebtoken';
import UserSession from '../models/user-session.model';
import { AppError, RabbitMqListener, RabbitMqManageConnection } from 'millez-lib-api';
import RabbitListener from './RabbitListener';
import { RABBITMQ_HOST_URL } from '../constants/rabbitmq-host-url';
import { RabbitMqQueues } from '../enums/rabbitmq-queues.enum';

jest.mock('jsonwebtoken');
jest.mock('../models/user-session.model');

jest.mock('millez-lib-api', () => ({
  RabbitMqManageConnection: jest.fn(),
  RabbitMqListener: jest.fn().mockImplementation(() => ({
    genericListener: jest.fn(),
  })),
}));

describe('RabbitListener', () => {
  let rabbitListener: RabbitListener;

  beforeEach(() => {
    rabbitListener = new RabbitListener();
    jest.clearAllMocks();
  });

  it('should create a token and save the user session', async () => {
    const mockUserId = '12345';
    const mockToken = 'mockToken';
    const mockKeepLoggedIn = true;
    jest.spyOn(jwt, 'sign').mockReturnValue(mockToken as any);
    const mockSave = jest.fn();
    (UserSession as unknown as jest.Mock).mockImplementation(() => ({
      save: mockSave,
    }));
    const result = await rabbitListener['createToken']({
      userId: mockUserId,
      keepLoggedIn: mockKeepLoggedIn,
    });
    expect(UserSession).toHaveBeenCalledWith({
      userId: mockUserId,
      token: mockToken,
      keepLoggedIn: mockKeepLoggedIn,
    });
    expect(mockSave).toHaveBeenCalled();
    expect(result).toEqual({ token: mockToken });
  });

  it('should create a token and save the user session with expiration date', async () => {
    const mockUserId = '12345';
    const mockToken = 'mockToken';
    const mockKeepLoggedIn = false;
    jest.spyOn(jwt, 'sign').mockReturnValue(mockToken as any);
    const mockSave = jest.fn();
    (UserSession as unknown as jest.Mock).mockImplementation(() => ({
      save: mockSave,
    }));
    const result = await rabbitListener['createToken']({
      userId: mockUserId,
      keepLoggedIn: mockKeepLoggedIn,
    });
    expect(UserSession).toHaveBeenCalledWith({
      userId: mockUserId,
      token: mockToken,
      keepLoggedIn: mockKeepLoggedIn,
    });
    expect(mockSave).toHaveBeenCalled();
    expect(result).toEqual({ token: mockToken });
  });
  
  it('should validate a token and return decoded data', () => {
    const mockToken = 'mockToken';
    const mockSecret = 'mockSecret';
    const mockDecoded = { userId: '12345' };
    process.env.JWT_SECRET = mockSecret;
    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, mockDecoded);
    });
    rabbitListener['validateSession'](mockToken);
    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      mockSecret,
      expect.any(Function)
    );
  });

  it('should throw an AppError if token validation fails', () => {
    const mockToken = 'mockToken';
    const mockSecret = 'mockSecret';
    const mockError = new Error('Invalid token');
    process.env.JWT_SECRET = mockSecret;
    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(mockError, null);
    });
    expect(() => rabbitListener['validateSession'](mockToken)).toThrow(AppError);
    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      mockSecret,
      expect.any(Function)
    );
  });

  it('should return undefined if JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    const result = rabbitListener['validateSession']('mockToken');
    expect(result).toBeUndefined();
  });
  
  it('should set up RabbitMQ listeners for CREATE_SESSION and VALIDATE_USER_SESSION queues', async () => {
    const mockConnection = {};
    const mockRabbitListener = {
      genericListener: jest.fn(),
    };
    (RabbitMqManageConnection as jest.Mock).mockReturnValue(mockConnection);
    (RabbitMqListener as jest.Mock).mockReturnValue(mockRabbitListener);
    await rabbitListener.listeners();
    expect(RabbitMqManageConnection).toHaveBeenCalledWith(RABBITMQ_HOST_URL);
    expect(RabbitMqListener).toHaveBeenCalledWith(mockConnection);
    expect(mockRabbitListener.genericListener).toHaveBeenCalledTimes(2);
    expect(mockRabbitListener.genericListener).toHaveBeenCalledWith(
      RabbitMqQueues.CREATE_SESSION,
      expect.any(Function)
    );
    expect(mockRabbitListener.genericListener).toHaveBeenCalledWith(
      RabbitMqQueues.VALIDATE_USER_SESSION,
      expect.any(Function)
    );
  });
});