package co.edu.udistrital.cc2.dto;

import java.util.List;

public record HashCollisionDto(String key, int initial, String method, List<HashAttemptDto> attempts, String finalPosition) { }
