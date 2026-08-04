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
    // The catch method is responsible for handling exceptions thrown during the request lifecycle. 
    // It retrieves the response and request objects from the ArgumentsHost, determines the appropriate status code and message 
    // based on the type of exception, and formats the response as a JSON object containing the status code, message, and request path.
  catch(exception: unknown, host: ArgumentsHost) {
    // Switch to the HTTP context to access the request and response objects
    const ctx = host.switchToHttp();
    // Get the response and request objects from the context
    const response = ctx.getResponse();
    // Get the request object from the context
    const request = ctx.getRequest();

    // Determine the status code and message based on the type of exception
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

        // Determine the message to return in the response. If the exception is an instance of HttpException,
        // it retrieves the response message from the exception. Otherwise, it defaults to a generic error message.
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

        // Format the response as a JSON object containing the status code, message, and request path, and send it back to the client.
    response.status(status).json({
      statusCode: status,
      message: typeof message === 'string' ? message : (message as any).message,
      path: request.url,
    });
  }
}