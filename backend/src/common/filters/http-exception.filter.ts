// This file is part of the NestJS framework and defines a custom exception filter for handling HTTP exceptions. The filter catches exceptions thrown during the request lifecycle and formats the response to include the status code, message, and request path. It uses decorators from the @nestjs/common package to define the filter and handle exceptions.
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

// The HttpExceptionFilter class implements the ExceptionFilter interface, which requires the implementation of the catch method. 
// The catch method takes two parameters: the exception that was thrown and the ArgumentsHost, which provides access to the request 
// and response objects. The filter checks if the exception is an instance of HttpException to determine the appropriate status code 
// and message to return in the response. If the exception is not an HttpException, 
// it defaults to returning a 500 Internal Server Error status code and a generic error message. 
// The response is then formatted as a JSON object containing the status code, message, and request path.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message: typeof message === 'string' ? message : (message as any).message,
      path: request.url,
    });
  }
}