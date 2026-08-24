package co.edu.udistrital.cc2.dto;

import java.util.List;

public record HashTransformResponse(String algorithm, List<String> initialStructure, List<String> table,
                                    List<List<String>> nested, List<List<Integer>> nestedByPosition, List<List<String>> lists, List<HashStepDto> steps,
                                    List<HashCollisionDto> collisions) { }
