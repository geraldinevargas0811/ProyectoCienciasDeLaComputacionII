package co.edu.udistrital.cc2.service;

import co.edu.udistrital.cc2.dto.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.List;

@Service
public class HashTransformationService {
    public HashTransformResponse search(HashSearchRequest request) {
        if (request == null || request.target() == null || !request.target().matches("\\d+")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La clave a buscar debe ser numérica.");
        HashTransformResponse structure = transform(new HashTransformRequest(request.keys(), request.size(), request.hashFunction(), request.collisionMethod()));
        int size = request.size(); int initial = hashPosition(request.target(), size, request.hashFunction());
        List<HashStepDto> steps = new ArrayList<>();
        List<String> table = structure.table(); List<List<String>> nested = structure.nested(); List<List<String>> lists = structure.lists();
        addStep(steps, request.target(), initial, initial, List.of(), "searching", "Buscar " + request.target() + ". " + hashDescription(request.target(), size, request.hashFunction(), initial), table, nested, lists);
        if ("nested".equals(request.collisionMethod())) return searchNested(request.target(), initial, structure, steps);
        if ("linked".equals(request.collisionMethod())) return searchLinked(request.target(), initial, structure, steps);
        return searchOpenAddressing(request.target(), initial, request.collisionMethod(), structure, steps);
    }

    private HashTransformResponse searchOpenAddressing(String target, int initial, String method, HashTransformResponse structure, List<HashStepDto> steps) {
        int size = structure.table().size(); int jump = "double".equals(method) ? secondHash(initial, size) : 0;
        for (int i = 0; i < size; i++) {
            int offset = "quadratic".equals(method) ? i * i : "double".equals(method) ? i * jump : i;
            int position = normalize(initial + offset, size); String value = structure.table().get(position - 1);
            String expression = expression(method, initial, i, position, jump);
            addStep(steps, target, initial, position, List.of(), "searching", "Evaluar " + expression + ".", structure.table(), structure.nested(), structure.lists());
            if (value == null) { addStep(steps, target, initial, position, List.of(), "discarded", "Posición " + position + " libre: la clave no se encuentra.", structure.table(), structure.nested(), structure.lists()); break; }
            if (target.equals(value)) { addStep(steps, target, initial, position, List.of(), "found", "Clave " + target + " encontrada en la posición " + position + ".", structure.table(), structure.nested(), structure.lists()); break; }
            addStep(steps, target, initial, position, List.of(new HashAttemptDto(position, true, expression)), "collision", "Posición " + position + " contiene " + value + ", clave diferente.", structure.table(), structure.nested(), structure.lists());
        }
        return new HashTransformResponse("Búsqueda por transformación de claves", structure.initialStructure(), structure.table(), structure.nested(), structure.nestedByPosition(), structure.lists(), steps, structure.collisions());
    }

    private HashTransformResponse searchNested(String target, int initial, HashTransformResponse structure, List<HashStepDto> steps) {
        String mainValue = structure.table().get(initial - 1);
        addStep(steps, target, initial, initial, List.of(), "searching", "Evaluar primero el arreglo principal, posición " + initial + ".", structure.table(), structure.nested(), structure.lists());
        if (target.equals(mainValue)) addStep(steps, target, initial, initial, List.of(), "found", "Clave " + target + " encontrada en el arreglo principal.", structure.table(), structure.nested(), structure.lists());
        else if (mainValue == null) addStep(steps, target, initial, initial, List.of(), "discarded", "Posición libre: la clave no se encuentra.", structure.table(), structure.nested(), structure.lists());
        else {
            boolean found = false;
            for (int array : structure.nestedByPosition().get(initial - 1)) {
                String value = structure.nested().get(array - 1).get(initial - 1);
                addStep(steps, target, initial, initial, List.of(), "searching", "Evaluar arreglo " + array + ", posición " + initial + ".", array, structure.table(), structure.nested(), structure.lists());
                if (target.equals(value)) { addStep(steps, target, initial, initial, List.of(), "found", "Clave " + target + " encontrada en el arreglo " + array + ".", array, structure.table(), structure.nested(), structure.lists()); found = true; break; }
                if (value == null) { addStep(steps, target, initial, initial, List.of(), "discarded", "Posición libre en el arreglo " + array + ": la clave no se encuentra.", array, structure.table(), structure.nested(), structure.lists()); break; }
                addStep(steps, target, initial, initial, List.of(), "collision", "Arreglo " + array + " contiene " + value + ", clave diferente.", array, structure.table(), structure.nested(), structure.lists());
            }
            if (!found) addStep(steps, target, initial, initial, List.of(), "discarded", "Se agotó la ruta asociada a la posición " + initial + ": la clave no se encuentra.", structure.table(), structure.nested(), structure.lists());
        }
        return new HashTransformResponse("Búsqueda por transformación de claves", structure.initialStructure(), structure.table(), structure.nested(), structure.nestedByPosition(), structure.lists(), steps, structure.collisions());
    }

    private HashTransformResponse searchLinked(String target, int initial, HashTransformResponse structure, List<HashStepDto> steps) {
        List<String> chain = structure.lists().get(initial - 1);
        if (chain == null) { addStep(steps, target, initial, initial, List.of(), "discarded", "Posición " + initial + " libre: la clave no se encuentra.", structure.table(), structure.nested(), structure.lists()); }
        else {
            boolean found = false;
            for (int index = 0; index < chain.size(); index += 1) {
                String value = chain.get(index); int current = index == 0 ? initial : 0;
                addStep(steps, target, initial, current, List.of(), "searching", "Evaluar " + (index == 0 ? "la posición principal" : "el nodo " + index) + ".", 0, index, structure.table(), structure.nested(), structure.lists());
                if (target.equals(value)) { addStep(steps, target, initial, current, List.of(), "found", "Clave " + target + " encontrada.", 0, index, structure.table(), structure.nested(), structure.lists()); found = true; break; }
                addStep(steps, target, initial, current, List.of(), "collision", value + " no coincide con " + target + ".", 0, index, structure.table(), structure.nested(), structure.lists());
            }
            if (!found) addStep(steps, target, initial, initial, List.of(), "discarded", "Se agotó la lista enlazada: la clave no se encuentra.", structure.table(), structure.nested(), structure.lists());
        }
        return new HashTransformResponse("Búsqueda por transformación de claves", structure.initialStructure(), structure.table(), structure.nested(), structure.nestedByPosition(), structure.lists(), steps, structure.collisions());
    }
    public HashTransformResponse transform(HashTransformRequest request) {
        validate(request);
        int size = request.size();
        List<String> table = empty(size);
        // Cada elemento de nested es un arreglo completo lateral creado por una colisión.
        List<List<String>> nested = new ArrayList<>(), lists = emptyStructures(size);
        List<List<Integer>> nestedByPosition = emptyAssociations(size);
        List<HashStepDto> steps = new ArrayList<>();
        List<HashCollisionDto> collisions = new ArrayList<>();
        addStep(steps, null, 0, 0, List.of(), "initial", "Estructura vacía: aún no se ha procesado ninguna clave.", table, nested, lists);
        for (String key : request.keys()) {
            int initial = hashPosition(key, size, request.hashFunction());
            addStep(steps, key, initial, initial, List.of(), "processing", "Procesar la clave " + key + ".", table, nested, lists);
            addStep(steps, key, initial, initial, List.of(), "hash", "Clave " + key + ". " + hashDescription(key, size, request.hashFunction(), initial), table, nested, lists);
            switch (request.collisionMethod()) {
                case "linear", "quadratic", "double" -> placeOpenAddressing(key, initial, size, request.collisionMethod(), table, nested, lists, steps, collisions);
                case "nested" -> placeNested(key, initial, size, table, nested, nestedByPosition, lists, steps, collisions);
                case "linked" -> placeLinked(key, initial, table, nested, lists, steps, collisions);
                default -> throw unsupported("Método de colisión no reconocido: " + request.collisionMethod());
            }
        }
        return new HashTransformResponse("Transformación por claves", List.copyOf(request.keys()), table, nested, nestedByPosition, lists, steps, collisions);
    }

    private void placeOpenAddressing(String key, int initial, int size, String method, List<String> table, List<List<String>> nested, List<List<String>> lists, List<HashStepDto> steps, List<HashCollisionDto> collisions) {
        List<HashAttemptDto> attempts = new ArrayList<>();
        int jump = "double".equals(method) ? secondHash(initial, size) : 0;
        for (int i = 0; i < size; i++) {
            int offset = switch (method) { case "quadratic" -> i * i; case "double" -> i * jump; default -> i; };
            int position = normalize(initial + offset, size);
            boolean occupied = table.get(position - 1) != null;
            String expression = expression(method, initial, i, position, jump);
            attempts.add(new HashAttemptDto(position, occupied, expression));
            addStep(steps, key, initial, position, attempts, "evaluating", "Evaluar " + expression + ": posición " + position + ".", table, nested, lists);
            if (occupied) {
                addStep(steps, key, initial, position, attempts, "collision", "Colisión en posición " + position + ": está ocupada por " + table.get(position - 1) + ".", table, nested, lists);
            } else {
                addStep(steps, key, initial, position, attempts, "available", "Posición " + position + " libre.", table, nested, lists);
            }
            if (!occupied) {
                table.set(position - 1, key);
                addStep(steps, key, initial, position, attempts, "inserted", "Posición " + position + " libre: insertar la clave " + key + ".", table, nested, lists);
                if (i > 0) collisions.add(new HashCollisionDto(key, initial, methodName(method), List.copyOf(attempts), String.valueOf(position)));
                return;
            }
        }
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "No se encontró una posición disponible para la clave " + key + ".");
    }

    private void placeNested(String key, int initial, int size, List<String> table, List<List<String>> nested, List<List<Integer>> nestedByPosition, List<List<String>> lists, List<HashStepDto> steps, List<HashCollisionDto> collisions) {
        int bucket = initial - 1;
        // Regla 1: toda clave se evalúa SIEMPRE primero contra el arreglo principal.
        addStep(steps, key, initial, initial, List.of(), "evaluating", "Evaluar primero el arreglo principal, posición " + initial + ".", table, nested, lists);
        if (table.get(bucket) == null) {
            table.set(bucket, key);
            addStep(steps, key, initial, initial, List.of(), "inserted", "Posición " + initial + " libre: insertar la clave " + key + " en el arreglo principal.", table, nested, lists); return;
        }
        List<HashAttemptDto> attempts = new ArrayList<>(List.of(new HashAttemptDto(initial, true, "posición principal " + initial)));
        addStep(steps, key, initial, initial, List.copyOf(attempts), "collision", "Colisión en la posición " + initial + ": está ocupada por " + table.get(bucket) + ".", table, nested, lists);
        // Regla 2: recorrer EN ORDEN los arreglos existentes (1, 2, ...) consultando LA MISMA posición.
        // La primera posición libre termina la inserción; ningún arreglo nuevo se crea en este punto.
        List<Integer> associated = nestedByPosition.get(bucket);
        for (int arrayIndex = 0; arrayIndex < nested.size(); arrayIndex += 1) {
            List<String> lateral = nested.get(arrayIndex);
            int arrayNumber = arrayIndex + 1;
            addStep(steps, key, initial, initial, List.copyOf(attempts), "evaluating", "Evaluar el arreglo " + arrayNumber + ", posición " + initial + ".", arrayNumber, table, nested, lists);
            if (lateral.get(bucket) == null) {
                lateral.set(bucket, key);
                if (!associated.contains(arrayNumber)) associated.add(arrayNumber);
                addStep(steps, key, initial, initial, List.copyOf(attempts), "inserted", "Arreglo " + arrayNumber + ", posición " + initial + " libre: insertar la clave " + key + ".", arrayNumber, table, nested, lists);
                collisions.add(new HashCollisionDto(key, initial, "Arreglos anidados", List.copyOf(attempts), "arreglo " + arrayNumber + ", posición " + initial));
                return;
            }
            attempts.add(new HashAttemptDto(initial, true, "arreglo " + arrayNumber + ", posición " + initial));
            addStep(steps, key, initial, initial, List.copyOf(attempts), "collision", "Colisión en el arreglo " + arrayNumber + ", posición " + initial + ": está ocupada por " + lateral.get(bucket) + ".", arrayNumber, table, nested, lists);
        }
        // Regla 3: únicamente cuando la posición está ocupada en TODOS los arreglos existentes se crea el siguiente.
        if (nested.size() >= size - 1) throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Se alcanzó el máximo de arreglos anidados para esta tabla.");
        int nextArrayNumber = nested.size() + 1;
        addStep(steps, key, initial, initial, List.copyOf(attempts), "evaluating", "La posición " + initial + " está ocupada en todos los arreglos existentes. Crear el siguiente arreglo completo a la derecha.", nextArrayNumber, table, nested, lists);
        List<String> nextArray = empty(size); nextArray.set(bucket, key); nested.add(nextArray);
        associated.add(nextArrayNumber);
        addStep(steps, key, initial, initial, List.copyOf(attempts), "inserted", "Arreglo " + nextArrayNumber + ", posición " + initial + " libre: insertar la clave " + key + ".", nextArrayNumber, table, nested, lists);
        collisions.add(new HashCollisionDto(key, initial, "Arreglos anidados", List.copyOf(attempts), "arreglo " + nextArrayNumber + ", posición " + initial));
    }

    private void placeLinked(String key, int initial, List<String> table, List<List<String>> nested, List<List<String>> lists, List<HashStepDto> steps, List<HashCollisionDto> collisions) {
        int bucket = initial - 1;
        addStep(steps, key, initial, initial, List.of(), "evaluating", "Evaluar primero el arreglo principal, posición " + initial + ".", table, nested, lists);
        if (lists.get(bucket) == null) { List<String> chain = new ArrayList<>(); chain.add(key); lists.set(bucket, chain); table.set(bucket, key); addStep(steps, key, initial, initial, List.of(), "inserted", "Posición " + initial + " libre: insertar la clave " + key + ".", table, nested, lists); return; }
        List<HashAttemptDto> attempts = List.of(new HashAttemptDto(initial, true, "posición principal " + initial));
        String head = lists.get(bucket).get(0);
        addStep(steps, key, initial, initial, attempts, "collision", "Colisión en la posición " + initial + ": está ocupada por " + head + ". Se enlaza un nodo al final de la cadena.", table, nested, lists);
        List<String> chain = lists.get(bucket); String previous = chain.get(chain.size() - 1); chain.add(key);
        addStep(steps, key, initial, initial, attempts, "inserted", "Nodo [" + key + "] enlazado después de [" + previous + "].", 0, chain.size() - 1, table, nested, lists);
        collisions.add(new HashCollisionDto(key, initial, "Listas enlazadas", attempts, "nodo " + chain.size()));
    }

    /** Registro interno: cada función hash produce su explicación y su posición en un único lugar,
     *  de modo que posición y descripción nunca pueden divergir entre sí. */
    private record KeyTransform(String description, int position) { }

    // Módulo: H(D) = (D mod N) + 1.
    private KeyTransform moduloTransform(String key, int size) {
        int position = Math.floorMod(Integer.parseInt(key), size) + 1;
        return new KeyTransform("H(" + key + ") = (" + key + " mod " + size + ") + 1 = " + position + ".", position);
    }
    // Cuadrado medio estándar: C = D²; se extraen tantos dígitos centrales como dígitos tenga N.
    // Si el cuadrado es demasiado corto se rellena con ceros a la izquierda para que siempre
    // existan dígitos centrales después de descartar los extremos por igual.
    private KeyTransform squareTransform(String key, int size) {
        long square = (long) Integer.parseInt(key) * Integer.parseInt(key);
        String digits = String.valueOf(square);
        int required = String.valueOf(size).length();
        StringBuilder padded = new StringBuilder(digits);
        while (padded.length() < required + 2) padded.insert(0, '0');
        int discard = (padded.length() - required) / 2;
        String middle = padded.substring(discard, discard + required);
        int position = rawPosition(Integer.parseInt(middle), size);
        String padding = padded.length() > digits.length() ? " (se rellena con ceros a la izquierda)" : "";
        return new KeyTransform("H(" + key + "): " + key + " × " + key + " = " + square + padding + " → dígitos centrales \"" + middle + "\" → (" + middle + " mod " + size + ") + 1 = " + position + ".", position);
    }
    // Truncamiento estándar: se conservan el primer y el último dígito de la clave y se descartan los intermedios.
    // Con una clave de un solo dígito ese dígito se duplica para formar la dirección.
    private KeyTransform truncationTransform(String key, int size) {
        String digits = String.valueOf(Integer.parseInt(key));
        String truncated = "" + digits.charAt(0) + digits.charAt(digits.length() - 1);
        int position = rawPosition(Integer.parseInt(truncated), size);
        String explanation = digits.length() == 1 ? "dígito único " + truncated : "primer y último dígito → " + truncated;
        return new KeyTransform("H(" + key + "): truncamiento con " + explanation + " → (" + truncated + " mod " + size + ") + 1 = " + position + ".", position);
    }
    // Plegamiento estándar: la clave se divide en grupos del mismo tamaño que N
    // (el último grupo puede quedar más corto) y los grupos se suman.
    private KeyTransform foldingTransform(String key, int size) {
        String digits = String.valueOf(Integer.parseInt(key));
        int groupSize = String.valueOf(size).length();
        int sum = 0;
        StringBuilder groups = new StringBuilder();
        for (int index = 0; index < digits.length(); index += groupSize) {
            String group = digits.substring(index, Math.min(index + groupSize, digits.length()));
            sum += Integer.parseInt(group);
            if (groups.length() > 0) groups.append(" + ");
            groups.append(group);
        }
        int position = rawPosition(sum, size);
        return new KeyTransform("H(" + key + "): grupos de " + groupSize + " dígito" + (groupSize == 1 ? "" : "s") + " " + groups + " → suma = " + sum + " → (" + sum + " mod " + size + ") + 1 = " + position + ".", position);
    }
    // Normalización común: cualquier valor crudo queda dentro del rango 1..N.
    private int rawPosition(int raw, int size) { return Math.floorMod(raw, size) + 1; }
    /** Toda la matemática de transformación vive en el servidor; el frontend solo la muestra. */
    private KeyTransform describeHash(String key, int size, String hashFunction) {
        return switch (hashFunction) {
            case "modulo" -> moduloTransform(key, size);
            case "square" -> squareTransform(key, size);
            case "truncation" -> truncationTransform(key, size);
            case "folding" -> foldingTransform(key, size);
            default -> throw unsupported("Función hash no reconocida: " + hashFunction);
        };
    }
    private int hashPosition(String key, int size, String hashFunction) { return describeHash(key, size, hashFunction).position(); }
    private String hashDescription(String key, int size, String hashFunction, int position) { return describeHash(key, size, hashFunction).description(); }
    // Regla confirmada en los apuntes: H'(D) = ((D + 1) mod N) + 1.
    private int secondHash(int initial, int size) { return Math.floorMod(initial + 1, size) + 1; }
    private int normalize(int position, int size) { return Math.floorMod(position - 1, size) + 1; }
    private String expression(String method, int initial, int i, int position, int jump) {
        if (i == 0) return String.valueOf(initial);
        if ("quadratic".equals(method)) return initial + " + " + i + "² = " + position;
        if ("double".equals(method)) return initial + " + " + i + " × H'(" + initial + ") [" + jump + "] = " + position;
        return initial + " + " + i + " = " + position;
    }
    private String methodName(String method) { return switch (method) { case "quadratic" -> "Prueba cuadrática"; case "double" -> "Doble función hash"; default -> "Prueba lineal"; }; }
    private List<String> empty(int size) { return new ArrayList<>(java.util.Collections.nCopies(size, null)); }
    private List<List<String>> emptyStructures(int size) { return new ArrayList<>(java.util.Collections.nCopies(size, null)); }
    private void addStep(List<HashStepDto> steps, String key, int initial, int current, List<HashAttemptDto> attempts, String action, String description, List<String> table, List<List<String>> nested, List<List<String>> lists) {
        addStep(steps, key, initial, current, attempts, action, description, 0, table, nested, lists);
    }
    private void addStep(List<HashStepDto> steps, String key, int initial, int current, List<HashAttemptDto> attempts, String action, String description, int currentArray, List<String> table, List<List<String>> nested, List<List<String>> lists) {
        addStep(steps, key, initial, current, attempts, action, description, currentArray, -1, table, nested, lists);
    }
    private void addStep(List<HashStepDto> steps, String key, int initial, int current, List<HashAttemptDto> attempts, String action, String description, int currentArray, int currentNode, List<String> table, List<List<String>> nested, List<List<String>> lists) {
        // Las celdas vacías se representan con null; List.copyOf no admite null.
        steps.add(new HashStepDto(key, initial, current, currentArray, currentNode, List.copyOf(attempts), action, description, new ArrayList<>(table), copyStructures(nested), copyStructures(lists)));
    }
    private List<List<String>> copyStructures(List<List<String>> source) { List<List<String>> copy = new ArrayList<>(); for (List<String> item : source) copy.add(item == null ? null : new ArrayList<>(item)); return copy; }
    private List<List<Integer>> emptyAssociations(int size) { List<List<Integer>> associations = new ArrayList<>(); for (int index = 0; index < size; index += 1) associations.add(new ArrayList<>()); return associations; }
    private void validate(HashTransformRequest request) {
        if (request == null || request.size() == null || request.size() < 1 || request.keys() == null || request.keys().isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se requiere un tamaño positivo y al menos una clave.");
        if (request.keys().stream().anyMatch(key -> key == null || !key.matches("\\d+"))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las claves deben ser numéricas.");
        if (request.keys().stream().distinct().count() != request.keys().size()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se permiten claves repetidas.");
    }
    private ResponseStatusException unsupported(String message) { return new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, message); }
}
