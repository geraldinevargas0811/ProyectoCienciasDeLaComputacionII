"""Búsqueda Secuencial usando Bloques (Block Search / búsqueda indexada).

Programa completo en Python que implementa la búsqueda secuencial por bloques
sobre una lista de números ordenados.

Estrategia:
    1. La lista ordenada se divide en bloques de tamaño configurable.
    2. Se genera un índice auxiliar con el valor máximo (tope) de cada bloque.
    3. Para buscar un valor se recorre primero el índice de forma secuencial
       hasta ubicar el bloque que podría contenerlo.
    4. Dentro de ese bloque se realiza una búsqueda secuencial tradicional.

La clase ``BusquedaPorBloques`` sigue los principios de la programación
orientada a objetos: encapsula sus datos, expone métodos públicos bien
definidos y deja los detalles internos como métodos privados.
"""

from typing import List, Optional


class BusquedaPorBloques:
    """Modela la búsqueda secuencial por bloques (búsqueda indexada).

    Atributos:
        _datos: lista de números ordenada de forma ascendente.
        _tamano_bloque: cantidad máxima de elementos que admite cada bloque.
        _bloques: bloques en los que se divide la lista (cada uno es una lista).
        _indice: topes (valores máximos) de cada bloque, en orden.
    """

    def __init__(self, datos: List[int], tamano_bloque: int) -> None:
        """Constructor de la clase.

        Args:
            datos: lista de números que debe estar ordenada ascendente.
            tamano_bloque: cantidad de elementos por bloque (mayor que 0).

        Raises:
            ValueError: si el tamaño del bloque no es válido o si la lista
                no está ordenada (requisito del algoritmo).
        """
        if tamano_bloque <= 0:
            raise ValueError("El tamaño del bloque debe ser mayor que 0.")

        self._tamano_bloque: int = tamano_bloque
        self._datos: List[int] = list(datos)
        self._bloques: List[List[int]] = []
        self._indice: List[int] = []

        # El algoritmo exige una lista ordenada; se valida al construir
        # la estructura para evitar resultados incorrectos.
        if not self._es_ordenada(self._datos):
            raise ValueError("La lista de datos debe estar ordenada de forma ascendente.")

    # ------------------------------------------------------------------ #
    # Métodos públicos solicitados en el enunciado
    # ------------------------------------------------------------------ #

    def crear_bloques(self) -> None:
        """Divide la lista ordenada en bloques del tamaño configurado.

        Ejemplo: con una lista de 12 elementos y tamaño 4 se obtienen
        3 bloques: B1 [1..4], B2 [5..8], B3 [9..12].
        """
        # Se recorren posiciones de 0 en 0 + tamano_bloque y se toman
        # los cortes correspondientes de la lista.
        self._bloques = [
            self._datos[i:i + self._tamano_bloque]
            for i in range(0, len(self._datos), self._tamano_bloque)
        ]
        print(f"\n[Bloques] Lista dividida en bloques de tamaño {self._tamano_bloque}.")

    def crear_indice(self) -> None:
        """Genera el índice con el valor máximo (tope) de cada bloque.

        Como la lista está ordenada, el último elemento de cada bloque es
        su valor máximo y sirve como referencia para ubicar las búsquedas.
        """
        # Si aún no existen bloques, se construyen antes de crear el índice.
        if not self._bloques:
            self.crear_bloques()

        # El tope de cada bloque es su último elemento (el mayor de todos).
        self._indice = [bloque[-1] for bloque in self._bloques if bloque]
        print(f"[Índice] Topes (máximos por bloque): {self._indice}")

    def mostrar_bloques(self) -> None:
        """Muestra por consola los bloques y el índice de la estructura."""
        if not self._bloques:
            print("\nAún no se han creado los bloques. Ejecuta crear_bloques().")
            return

        print("\n[Mostrar bloques]")
        for numero, bloque in enumerate(self._bloques, start=1):
            print(f"  B{numero}: {bloque}")
        print(f"  Índice: {self._indice}")

    def buscar(self, valor: int) -> Optional[int]:
        """Busca ``valor`` mostrando el proceso paso a paso.

        El proceso consta de dos fases:
            1. Recorrido secuencial por el índice hasta dar con el bloque.
            2. Búsqueda secuencial dentro del bloque elegido.

        Args:
            valor: número entero a buscar.

        Returns:
            Posición (índice 0-based) del valor dentro de la lista original,
            o None si el valor no se encuentra en la estructura.
        """
        # Asegura que la estructura esté construida aunque el usuario haya
        # llamado directamente a ``buscar`` sin construir antes.
        if not self._datos:
            print("\n[Buscar] La estructura está vacía: no hay nada que buscar.")
            return None
        if not self._indice:
            self.crear_bloques()
            self.crear_indice()

        comparaciones = 0
        print(f"\n[Buscar] Valor objetivo: {valor}")
        print("-" * 64)

        # Fase 1: recorrido secuencial por el índice de bloques.
        bloque_elegido: Optional[int] = None
        for i, tope in enumerate(self._indice):
            comparaciones += 1
            if valor <= tope:
                print(f"Comparar {valor} con el tope {tope} -> bloque encontrado (bloque {i + 1}).")
                bloque_elegido = i
                break
            print(f"Comparar {valor} con el tope {tope} -> continuar.")

        # Si el valor supera el último tope, no puede estar en la estructura.
        if bloque_elegido is None:
            self._reportar_resultado(valor, None, comparaciones)
            return None

        # Fase 2: búsqueda secuencial dentro del bloque elegido.
        bloque = self._bloques[bloque_elegido]
        print(f"Buscar dentro del bloque {bloque_elegido + 1}: {bloque}.")

        for local, item in enumerate(bloque):
            comparaciones += 1
            if item == valor:
                # Se traduce la posición local del bloque a la posición
                # absoluta dentro de la lista original.
                posicion = self._posicion_absoluta(bloque_elegido, local)
                print(f"Comparar {valor} con {item} -> coinciden. Encontrado.")
                self._reportar_resultado(valor, posicion, comparaciones, encontrado=True)
                return posicion
            print(f"Comparar {valor} con {item} -> no es igual. Continuar.")

        # Se agotó el bloque sin encontrar el valor.
        self._reportar_resultado(valor, None, comparaciones)
        return None

    # ------------------------------------------------------------------ #
    # Métodos privados (auxiliares internos)
    # ------------------------------------------------------------------ #

    @property
    def datos(self) -> List[int]:
        """Devuelve la lista de datos (solo lectura para el usuario)."""
        return self._datos

    @staticmethod
    def _es_ordenada(datos: List[int]) -> bool:
        """Verifica si una lista está ordenada de forma ascendente."""
        return all(datos[i] <= datos[i + 1] for i in range(len(datos) - 1))

    def _posicion_absoluta(self, bloque: int, local: int) -> int:
        """Convierte la posición local dentro de un bloque a la posición
        absoluta dentro de la lista original (índice 0-based)."""
        return bloque * self._tamano_bloque + local

    def _reportar_resultado(
        self,
        valor: int,
        posicion: Optional[int],
        comparaciones: int,
        encontrado: bool = False,
    ) -> None:
        """Imprime el resultado final de la búsqueda (encontrado o no)."""
        if encontrado and posicion is not None:
            print(f"Elemento {valor} encontrado en la posición {posicion + 1} "
                  f"(índice {posicion} con base 0) de la lista.")
        else:
            print(f"El elemento {valor} no existe en la estructura.")
        print(f"Comparaciones realizadas: {comparaciones}.")
        print("-" * 64)


def main() -> None:
    """Ejemplo de funcionamiento tomado del enunciado."""
    datos = [3, 7, 12, 18, 25, 31, 40, 46, 52, 60, 68, 75]
    tamano_bloque = 4

    # 1. Se crea la estructura con la lista ordenada y el tamaño de bloque.
    busqueda = BusquedaPorBloques(datos, tamano_bloque)

    print("Datos:", busqueda.datos)
    print("Tamaño del bloque:", tamano_bloque)

    # 2. División en bloques e índice de topes.
    busqueda.crear_bloques()
    busqueda.crear_indice()
    busqueda.mostrar_bloques()

    # 3. Casos de búsqueda.
    busqueda.buscar(40)   # Se ubica en el bloque 2.
    busqueda.buscar(25)   # Primer elemento del bloque 2.
    busqueda.buscar(100)  # Valor inexistente.


if __name__ == "__main__":
    main()