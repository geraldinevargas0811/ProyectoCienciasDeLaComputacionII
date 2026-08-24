package co.edu.udistrital.cc2.dto;

import java.util.List;

public record HashTransformRequest(List<String> keys, Integer size, String hashFunction, String collisionMethod) { }
