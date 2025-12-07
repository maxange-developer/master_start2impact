# Immagini Blog

Questa cartella contiene le immagini per gli articoli del blog.

## Come Aggiungere Immagini

Ogni articolo ha un `image_slug` che viene usato per mappare l'immagine corrispondente.

### Elenco Image Slugs degli Articoli:

1. `parco-nazionale-del.jpg` → Parco Nazionale del Teide
2. `siam-park.jpg` → Siam Park
3. `parco-rurale-di.jpg` → Parco Rurale di Anaga
4. `whale-watching-a.jpg` → Whale Watching
5. `masca-e-il.jpg` → Masca
6. `costa-adeje-las.jpg` → Costa Adeje, Las Américas e Los Cristianos
7. `puerto-de-la.jpg` → Puerto de la Cruz
8. `loro-parque.jpg` → Loro Parque
9. `garachico-rinascita-dopo.jpg` → Garachico
10. `la-laguna.jpg` → La Laguna
11. `gastronomia-di-tenerife.jpg` → Gastronomia
12. `vini-di-tenerife.jpg` → Vini di Tenerife
13. `spiagge-di-tenerife.jpg` → Spiagge
14. `santa-cruz-de.jpg` → Santa Cruz
15. `carnevale-di-santa.jpg` → Carnevale
16. `clima-e-microclimi.jpg` → Clima e Microclimi
17. `outdoor-e-sport.jpg` → Outdoor e Sport
18. `escursioni-alle-isole.jpg` → Isole Vicine
19. `tenerife-con-bambini.jpg` → Tenerife con Bambini
20. `vivere-a-tenerife.jpg` → Vivere a Tenerife

### Formato Consigliato

- **Formato**: JPG o PNG
- **Dimensioni**: Almeno 1200x800px (ratio 3:2)
- **Peso**: Massimo 500KB per immagine (usa compressione se necessario)

### Placeholder Temporaneo

Se non hai ancora le immagini, il sistema gestisce automaticamente l'errore nascondendo il placeholder.

### Aggiornare image_url nel Database

Una volta caricate tutte le immagini, puoi aggiornare il campo `image_url` nel database eseguendo:

```python
python scripts/update_image_urls.py
```

Oppure manualmente con uno script SQL.
