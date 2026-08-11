import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;

public class Grafo {

    private final Map<String, List<String>> adyacencia;

    public Grafo() {
        adyacencia = new HashMap<>();
    }

    public void agregarVertice(String vertice) {
        adyacencia.putIfAbsent(vertice, new ArrayList<>());
    }

    public void agregarArista(String origen, String destino) {
        agregarVertice(origen);
        agregarVertice(destino);

        adyacencia.get(origen).add(destino);
        adyacencia.get(destino).add(origen);
    }

    public void imprimir() {
        for (Map.Entry<String, List<String>> entrada : adyacencia.entrySet()) {
            System.out.println(entrada.getKey() + " -> " + entrada.getValue());
        }
    }

    public void bfs(String inicio) {
        validarVertice(inicio);

        Set<String> visitados = new HashSet<>();
        Queue<String> cola = new ArrayDeque<>();

        visitados.add(inicio);
        cola.offer(inicio);

        while (!cola.isEmpty()) {
            String actual = cola.poll();

            System.out.print(actual + " ");

            for (String vecino : adyacencia.get(actual)) {
                if (visitados.add(vecino)) {
                    cola.offer(vecino);
                }
            }
        }

        System.out.println();
    }

    public void dfsRecursivo(String inicio) {
        validarVertice(inicio);

        Set<String> visitados = new HashSet<>();
        dfsRecursivo(inicio, visitados);
        System.out.println();
    }

    private void dfsRecursivo(String actual, Set<String> visitados) {
        visitados.add(actual);

        System.out.print(actual + " ");

        for (String vecino : adyacencia.get(actual)) {
            if (!visitados.contains(vecino)) {
                dfsRecursivo(vecino, visitados);
            }
        }
    }

    public void dfsIterativo(String inicio) {
        validarVertice(inicio);

        Set<String> visitados = new HashSet<>();
        Deque<String> pila = new ArrayDeque<>();

        pila.push(inicio);

        while (!pila.isEmpty()) {
            String actual = pila.pop();

            if (!visitados.add(actual)) {
                continue;
            }

            System.out.print(actual + " ");

            List<String> vecinos = adyacencia.get(actual);

            for (int i = vecinos.size() - 1; i >= 0; i--) {
                String vecino = vecinos.get(i);

                if (!visitados.contains(vecino)) {
                    pila.push(vecino);
                }
            }
        }

        System.out.println();
    }

    private void validarVertice(String vertice) {
        if (!adyacencia.containsKey(vertice)) {
            throw new IllegalArgumentException("El vértice '" + vertice + "' no existe.");
        }
    }

    public static void main(String[] args) {
        Grafo grafo = new Grafo();

        grafo.agregarArista("A", "B");
        grafo.agregarArista("A", "C");
        grafo.agregarArista("B", "D");
        grafo.agregarArista("C", "D");
        grafo.agregarArista("C", "E");

        System.out.println("Lista de adyacencia:");
        grafo.imprimir();

        System.out.println("\nBFS desde A:");
        grafo.bfs("A");

        System.out.println("DFS recursivo desde A:");
        grafo.dfsRecursivo("A");

        System.out.println("DFS iterativo desde A:");
        grafo.dfsIterativo("A");
    }
}
