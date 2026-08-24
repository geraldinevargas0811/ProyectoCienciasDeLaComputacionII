package co.edu.udistrital.cc2.service;

import co.edu.udistrital.cc2.dto.HashSearchRequest;
import co.edu.udistrital.cc2.dto.HashStepDto;
import co.edu.udistrital.cc2.dto.HashTransformRequest;
import co.edu.udistrital.cc2.dto.HashTransformResponse;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HashTransformationServiceTest {
    private final HashTransformationService service = new HashTransformationService();

    @Test
    void nestedScanVisitsExistingArraysInOrderForTheSamePosition() {
        // 35→6 (principal), 85→6 colisión → Arreglo 1. 11→2 (principal), 21→2 colisión:
        // como A1[2] está libre, 21 se inserta en el ARREGLO 1 y no se crea un Arreglo 2.
        HashTransformResponse result = service.transform(new HashTransformRequest(
                List.of("35", "85", "11", "21"), 10, "modulo", "nested"));

        assertEquals(1, result.nested().size());
        assertEquals("85", result.nested().get(0).get(5));
        assertEquals("21", result.nested().get(0).get(1));
        assertNull(result.nested().get(0).get(4));

        HashTransformResponse search = service.search(new HashSearchRequest(
                List.of("35", "85", "11", "21"), 10, "modulo", "nested", "21"));

        assertEquals("found", search.steps().get(search.steps().size() - 1).action());
        assertEquals(1, search.steps().get(search.steps().size() - 1).currentArray());
    }

    @Test
    void caso1CollisionInMainUsesFreeSlotInNestedArrayOneWithoutCreatingMore() {
        // H(2) = H(12) = 3: A0[3] = 2 ocupado, A1[3] libre → insertar en A1[3]; solo existen 2 arreglos.
        HashTransformResponse result = service.transform(new HashTransformRequest(List.of("2", "12"), 10, "modulo", "nested"));
        assertEquals("2", result.table().get(2));
        assertEquals(1, result.nested().size());
        assertEquals("12", result.nested().get(0).get(2));
        assertNull(result.nested().get(0).get(3));
    }

    @Test
    void caso2ThirdKeyCreatesArrayTwoOnlyAfterBothExistingSlotsAreOccupied() {
        // H = 3 para 2, 12 y 22: A0[3] y A1[3] ocupados → recién entonces se crea Arreglo 2.
        HashTransformResponse result = service.transform(new HashTransformRequest(List.of("2", "12", "22"), 10, "modulo", "nested"));
        assertEquals("2", result.table().get(2));
        assertEquals("12", result.nested().get(0).get(2));
        assertEquals(2, result.nested().size());
        assertEquals("22", result.nested().get(1).get(2));
        assertEquals(Arrays.asList(1, 2), result.nestedByPosition().get(2));
    }

    @Test
    void caso3NewKeyWithFreeMainSlotGoesToMainEvenIfNestedArraysExist() {
        // Tras poblar la posición 3 (A0 y A1), llega 7 con H(7) = 8: A0[8] libre → va al PRINCIPAL.
        HashTransformResponse result = service.transform(new HashTransformRequest(List.of("2", "12", "7"), 10, "modulo", "nested"));
        assertEquals("7", result.table().get(7));
        assertEquals(1, result.nested().size());
        assertNull(result.nested().get(0).get(7));
    }

    @Test
    void caso4OccupiedMainReusesFreeSamePositionSlotOfPreexistingNestedArray() {
        // A1 existe por colisiones en la posición 3; 7 ocupa A0[8] y 17 con H(17)=8 debe ir a A1[8], sin crear A2.
        HashTransformResponse result = service.transform(new HashTransformRequest(List.of("2", "12", "7", "17"), 10, "modulo", "nested"));
        assertEquals("7", result.table().get(7));
        assertEquals("17", result.nested().get(0).get(7));
        assertEquals(1, result.nested().size());
    }

    @Test
    void caso5NewArrayAppearsOnlyWhenEveryExistingArrayIsOccupiedAtThatPosition() {
        // Diez claves con H = 6: principal + nueve anidados llenos EN ORDEN; ninguna clave salta arreglos.
        List<String> keys = List.of("5", "15", "25", "35", "45", "55", "65", "75", "85", "95");
        HashTransformResponse result = service.transform(new HashTransformRequest(keys, 10, "modulo", "nested"));
        assertEquals(9, result.nested().size());
        for (int index = 0; index < 9; index += 1) {
            assertEquals(keys.get(index + 1), result.nested().get(index).get(5));
            assertNull(result.nested().get(index).get((5 + 3) % 10));
        }
        // Una undécima clave en la misma posición supera el máximo de 10 arreglos totales.
        assertThrows(ResponseStatusException.class,
                () -> service.transform(new HashTransformRequest(List.of("5", "15", "25", "35", "45", "55", "65", "75", "85", "95", "105"), 10, "modulo", "nested")));
    }

    @Test
    void nestedInsertionRecordsTheOrderedTraversalStepsForEachLevel() {
        HashTransformResponse result = service.transform(new HashTransformRequest(List.of("2", "12", "22"), 10, "modulo", "nested"));
        List<String> descriptions = result.steps().stream().map(HashStepDto::description).toList();
        assertTrue(descriptions.stream().anyMatch(text -> text.startsWith("Evaluar primero el arreglo principal")));
        assertTrue(descriptions.stream().anyMatch(text -> text.startsWith("Colisión en la posición 3")));
        assertTrue(descriptions.stream().anyMatch(text -> text.equals("Evaluar el arreglo 1, posición 3.")));
        assertTrue(descriptions.stream().anyMatch(text -> text.contains("Colisión en el arreglo 1, posición 3")));
        assertTrue(descriptions.stream().anyMatch(text -> text.contains("ocupada en todos los arreglos existentes")));
        assertTrue(descriptions.stream().anyMatch(text -> text.contains("Arreglo 2") && text.contains("insertar la clave 22")));
    }

    @Test
    void linkedSearchVisitsTheActualLateralNode() {
        HashTransformResponse search = service.search(new HashSearchRequest(
                List.of("16", "26", "36"), 10, "modulo", "linked", "36"));

        assertEquals("found", search.steps().get(search.steps().size() - 1).action());
        assertEquals(2, search.steps().get(search.steps().size() - 1).currentNode());
    }

    @Test
    void openAddressingKeepsTheEstablishedSequencesAndProducesVisualStates() {
        HashTransformResponse linear = service.transform(new HashTransformRequest(List.of("16", "26", "36"), 10, "modulo", "linear"));
        assertEquals(Arrays.asList(null, null, null, null, null, null, "16", "26", "36", null), linear.table());
        assertEquals("evaluating", linear.steps().get(3).action());
        assertEquals("collision", linear.steps().stream().filter(step -> "26".equals(step.key()) && "collision".equals(step.action())).findFirst().orElseThrow().action());

        HashTransformResponse quadratic = service.transform(new HashTransformRequest(List.of("16", "26", "36"), 10, "modulo", "quadratic"));
        assertEquals("16", quadratic.table().get(6));
        assertEquals("26", quadratic.table().get(7));
        assertEquals("36", quadratic.table().get(0));

        HashTransformResponse doubled = service.transform(new HashTransformRequest(List.of("16", "26"), 10, "modulo", "double"));
        assertEquals("16", doubled.table().get(6));
        assertEquals("26", doubled.table().get(5));
    }

    @Test
    void nestedAndLinkedStructuresSearchExistingAndMissingKeys() {
        HashTransformResponse nested = service.transform(new HashTransformRequest(List.of("35", "85", "95"), 10, "modulo", "nested"));
        assertEquals(List.of(1, 2), nested.nestedByPosition().get(5));
        assertEquals("85", nested.nested().get(0).get(5));
        assertEquals("95", nested.nested().get(1).get(5));

        HashTransformResponse absentNested = service.search(new HashSearchRequest(List.of("35", "85", "95"), 10, "modulo", "nested", "25"));
        assertEquals("discarded", absentNested.steps().get(absentNested.steps().size() - 1).action());

        HashTransformResponse linked = service.transform(new HashTransformRequest(List.of("16", "23", "30"), 7, "modulo", "linked"));
        assertEquals(List.of("16", "23", "30"), linked.lists().get(2));
        HashTransformResponse absentLinked = service.search(new HashSearchRequest(List.of("16", "23", "30"), 7, "modulo", "linked", "9"));
        assertEquals("discarded", absentLinked.steps().get(absentLinked.steps().size() - 1).action());
        assertNull(linked.table().get(0));
    }

    @Test
    void squareFunctionUsesStandardMiddleDigitsWithZeroPadding() {
        // 74² = 5476 → dígitos centrales (N=10 → 2 dígitos): "47" → (47 mod 10) + 1 = 8.
        HashTransformResponse square = service.transform(new HashTransformRequest(List.of("74"), 10, "square", "linear"));
        assertEquals("74", square.table().get(7));
        assertTrue(square.steps().stream().anyMatch(step -> step.description().contains("dígitos centrales \"47\"")));

        // 3² = 9 → relleno "0009" → centrales "00" → (0 mod 10) + 1 = 1.
        HashTransformResponse padded = service.transform(new HashTransformRequest(List.of("3"), 10, "square", "linear"));
        assertEquals("3", padded.table().get(0));
    }

    @Test
    void truncationKeepsFirstAndLastDigits() {
        // 123 → primer y último dígito 13 → (13 mod 10) + 1 = 4. Clave de un dígito: 5 → 55 → 6.
        HashTransformResponse truncation = service.transform(new HashTransformRequest(List.of("123", "5"), 10, "truncation", "linear"));
        assertEquals("123", truncation.table().get(3));
        assertEquals("5", truncation.table().get(5));
        assertTrue(truncation.steps().stream().anyMatch(step -> step.description().contains("primer y último dígito → 13")));
    }

    @Test
    void foldingSumsEqualSizedGroupsAndNormalizes() {
        // 123 con N=10 → grupos "12" y "3" → 15 → (15 mod 10) + 1 = 6; 456 → 45 + 6 = 51 → 2.
        HashTransformResponse folding = service.transform(new HashTransformRequest(List.of("123", "456"), 10, "folding", "linear"));
        assertEquals("123", folding.table().get(5));
        assertEquals("456", folding.table().get(1));

        HashTransformResponse found = service.search(new HashSearchRequest(List.of("123", "456"), 10, "folding", "linear", "456"));
        assertEquals("found", found.steps().get(found.steps().size() - 1).action());

        HashTransformResponse absent = service.search(new HashSearchRequest(List.of("123", "456"), 10, "folding", "linear", "999"));
        assertEquals("discarded", absent.steps().get(absent.steps().size() - 1).action());
    }

    @Test
    void nestedArraysGrowLaterallyUpToTenTotalArraysAndAlwaysCheckTheMainOneFirst() {
        List<String> keys = List.of("5", "15", "25", "35", "45", "55", "65", "75", "85", "95");
        HashTransformResponse result = service.transform(new HashTransformRequest(keys, 10, "modulo", "nested"));

        assertEquals(9, result.nested().size());
        assertEquals(Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9), result.nestedByPosition().get(5));
        for (int index = 0; index < 9; index += 1) {
            assertEquals(keys.get(index + 1), result.nested().get(index).get(5));
            assertNull(result.nested().get(index).get(0));
        }
        assertEquals("5", result.table().get(5));

        // Una clave más colisionando en la misma posición supera el máximo de 10 arreglos totales.
        assertThrows(ResponseStatusException.class,
                () -> service.transform(new HashTransformRequest(List.of("5", "15", "25", "35", "45", "55", "65", "75", "85", "95", "105"), 10, "modulo", "nested")));

        // Aunque ya exista Arreglo 1, toda clave nueva se comprueba primero contra el arreglo principal:
        // 22 → posición 3, libre en el arreglo 0, así que se inserta allí y no en el arreglo anidado.
        HashTransformResponse withFreeMainSlot = service.transform(new HashTransformRequest(List.of("35", "85", "22"), 10, "modulo", "nested"));
        assertEquals("22", withFreeMainSlot.table().get(2));
        assertEquals(1, withFreeMainSlot.nested().size());
        assertNull(withFreeMainSlot.nested().get(0).get(2));
    }
}
