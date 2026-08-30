package co.edu.udistrital.cc2.controller;

import co.edu.udistrital.cc2.dto.HashTransformRequest;
import co.edu.udistrital.cc2.dto.HashTransformResponse;
import co.edu.udistrital.cc2.dto.HashSearchRequest;
import co.edu.udistrital.cc2.service.HashTransformationService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hash")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"})
public class HashTransformationController {
    private final HashTransformationService service;
    public HashTransformationController(HashTransformationService service) { this.service = service; }
    @PostMapping("/transform")
    public HashTransformResponse transform(@RequestBody HashTransformRequest request) { return service.transform(request); }
    @PostMapping("/search")
    public HashTransformResponse search(@RequestBody HashSearchRequest request) { return service.search(request); }
    @PostMapping("/delete")
    public HashTransformResponse delete(@RequestBody HashSearchRequest request) { return service.delete(request); }
}
