package co.edu.udistrital.cc2.controller;

import co.edu.udistrital.cc2.model.ApiError;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> responseStatus(ResponseStatusException error) { return ResponseEntity.status(error.getStatusCode()).body(new ApiError(error.getReason())); }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> unexpected(Exception error) { return ResponseEntity.internalServerError().body(new ApiError("Error inesperado al procesar el algoritmo.")); }
}
