import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

public class GrafoPonderado {

    private static class Arista {
        private final String destino;
        private final int peso;

        private Arista(String destino, int peso) {
            this.destino = destino;
            this.peso = peso;
        }
    }

    private static class NodoDistancia {
        private final String vertice;
        private final int distancia;

        private NodoDistancia(String vertice, int distancia) {
            this.vertice = vertice;
            this.distancia = distancia;
        }
    }

    private final Map<String, List<Arista>> adyacencia;

    public GrafoPonderado() {
        adyacencia = new HashMap<>();
    }

    public void agregarVertice(String vertice) {
        adyacencia.putIfAbsent(vertice, new ArrayList<>());
    }

    public void agregarArista(String origen, String destino, int peso) {
        if (peso < 0) {
            throw new IllegalArgumentException("Dijkstra no admite pesos negativos.");
        }

        agregarVertice(origen);
        agregarVertice(destino);

        adyacencia.get(origen).add(new Arista(destino, peso));
        adyacencia.get(destino).add(new Arista(origen, peso));
    }

    public Map<String, Integer> dijkstra(String inicio) {
        if (!adyacencia.containsKey(inicio)) {
            throw new IllegalArgumentException("El vértice '" + inicio + "' no existe.");
        }

        Map<String, Integer> distancias = new HashMap<>();

        PriorityQueue<NodoDistancia> cola =
            new PriorityQueue<>(Comparator.comparingInt(nodo -> nodo.distancia));

        for (String vertice : adyacencia.keySet()) {
            distancias.put(vertice, Integer.MAX_VALUE);
        }

        distancias.put(inicio, 0);
        cola.offer(new NodoDistancia(inicio, 0));

        while (!cola.isEmpty()) {
            NodoDistancia actual = cola.poll();

            if (actual.distancia > distancias.get(actual.vertice)) {
                continue;
            }

            for (Arista arista : adyacencia.get(actual.vertice)) {
                int nuevaDistancia = actual.distancia + arista.peso;

                if (nuevaDistancia < distancias.get(arista.destino)) {
                    distancias.put(arista.destino, nuevaDistancia);
                    cola.offer(new NodoDistancia(arista.destino, nuevaDistancia));
                }
            }
        }

        return distancias;
    }

    public static void main(String[] args) {
        GrafoPonderado grafo = new GrafoPonderado();

        grafo.agregarArista("A", "B", 4);
        grafo.agregarArista("A", "C", 2);
        grafo.agregarArista("B", "D", 5);
        grafo.agregarArista("C", "D", 8);

        Map<String, Integer> distancias = grafo.dijkstra("A");

        System.out.println("Distancias mínimas desde A:");

        for (Map.Entry<String, Integer> entrada : distancias.entrySet()) {
            System.out.println(entrada.getKey() + " = " + entrada.getValue());
        }
    }
}
