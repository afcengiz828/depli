import { HttpExceptionFilter } from './http-exception.filter';
import { ArgumentsHost, BadRequestException } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/test-endpoint' }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should return a standard error format', () => {
    const exception = new BadRequestException('Invalid input');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid input',
      }),
    );
  });

  it('should include the request path in the error response', () => {
    const exception = new BadRequestException('Invalid input');

    filter.catch(exception, mockHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/test-endpoint',
      }),
    );
  });
});