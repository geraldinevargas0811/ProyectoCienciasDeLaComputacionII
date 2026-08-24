package co.edu.udistrital.cc2.dto;

import java.util.List;

public record HashStepDto(String key, int initial, int current, int currentArray, int currentNode, List<HashAttemptDto> attempts, String action,
                          String description, List<String> tableSnapshot, List<List<String>> nestedSnapshot,
                          List<List<String>> listsSnapshot) { }
