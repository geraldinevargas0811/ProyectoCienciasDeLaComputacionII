package co.edu.udistrital.cc2.dto;

import java.util.List;

public record HashSearchRequest(List<String> keys, Integer size, String hashFunction, String collisionMethod, String target) { }
