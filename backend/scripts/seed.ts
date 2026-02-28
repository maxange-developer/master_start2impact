/**
 * Database Seed Script
 *
 * Creates the SQLite database and populates it with:
 * - 1 admin user
 * - 20 blog articles about Tenerife
 *
 * Usage: npx ts-node scripts/seed.ts
 */

import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

// Ensure data directory exists
const dataDir = path.resolve(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, "sql_app.db");
console.log(`📁 Database path: ${dbPath}`);

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
  logging: false,
  define: {
    timestamps: false,
    freezeTableName: true,
  },
});

// ---------- Models ----------

const User = sequelize.define(
  "users",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    full_name: { type: DataTypes.STRING, allowNull: false },
    hashed_password: { type: DataTypes.STRING, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
    language: { type: DataTypes.STRING, defaultValue: "it" },
  },
  { timestamps: false, freezeTableName: true },
);

const Article = sequelize.define(
  "articles",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    excerpt: { type: DataTypes.STRING(500), allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    language: { type: DataTypes.STRING, defaultValue: "it" },
    image_url: { type: DataTypes.STRING, allowNull: true },
    image_slug: { type: DataTypes.STRING, allowNull: true },
    images: { type: DataTypes.TEXT, allowNull: true },
    structured_content: { type: DataTypes.TEXT, allowNull: true },
    author_id: { type: DataTypes.INTEGER, allowNull: true },
    is_published: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: false, freezeTableName: true },
);

const SavedArticle = sequelize.define(
  "saved_articles",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    article_id: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { timestamps: false, freezeTableName: true },
);

// ---------- Seed Data ----------

const articles = [
  {
    title:
      "Parco Nazionale del Teide: Manuale Definitivo tra Vulcani, Sentieri e Stelle",
    slug: "parco-nazionale-teide",
    category: "natura",
    image_url: "/images/blog/teide-1.jpg",
    image_slug: "teide-1",
    excerpt:
      "Il Parco Nazionale del Teide è il cuore pulsante di Tenerife: un Patrimonio UNESCO con vulcani, sentieri e uno dei migliori cieli stellati al mondo.",
    content: `Il Parco Nazionale del Teide è il cuore pulsante di Tenerife e uno dei paesaggi vulcanici più spettacolari al mondo. Dichiarato Patrimonio dell'Umanità UNESCO, racchiude una caldera di circa 17 km di diametro (le Cañadas) con al centro il maestoso Teide (3.718 m), la vetta più alta di Spagna.

## Come Raggiungere il Parco

Ci sono 4 strade panoramiche: da La Orotava (TF-21), da Vilaflor (TF-21), da La Esperanza (TF-24) e da Chío (TF-38).

## Punti Panoramici Imperdibili

- **Roques de García:** formazioni rocciose spettacolari con sentiero circolare di 3,5 km
- **Mirador de Llano de Ucanca:** vista frontale sul massiccio del Teide
- **Minas de San José:** distese di cenere vulcanica chiara

## Salita in Vetta

La funivia parte da 2.356 m fino a 3.555 m. Per raggiungere il cratere sommitale serve un permesso gratuito. Il trekking da Montaña Blanca richiede 5-6 ore e buona preparazione.

## Osservazione delle Stelle

Il Teide è una delle migliori Starlight Reserve al mondo. Diverse agenzie organizzano tour notturni con telescopi professionali.`,
  },
  {
    title: "Siam Park: Masterclass nel Parco Acquatico Numero Uno al Mondo",
    slug: "siam-park",
    category: "divertimento",
    image_url: "/images/blog/siam-park-1.webp",
    image_slug: "siam-park-1",
    excerpt:
      "Siam Park a Costa Adeje è il parco acquatico numero uno al mondo: adrenalina, relax e un tema thailandese curato nei minimi dettagli.",
    content: `Siam Park, a Costa Adeje, è molto più di un parco acquatico: è un vero parco tematico a tema thailandese, curato nei minimi dettagli, tra statue, giardini esotici e specchi d'acqua.

## Organizzare la Visita

Orari: in genere 10:00–18:00. Prenota i biglietti online per risparmiare. Il Fast Pass è consigliato nei periodi di punta.

## Attrazioni Adrenaliniche

- **Tower of Power:** caduta quasi verticale attraverso un acquario con squali
- **The Dragon:** grande imbuto con effetto assenza di peso
- **Kinnaree:** scivolo con gommoni multiposto e onda finale

## Aree Relax

- **Siam Beach:** spiaggia artificiale con sabbia e palme
- **Mai Thai River:** fiume artificiale rilassante
- **The Lost City:** area bambini con scivoli sicuri

## Consigli Pratici

Porta ciabatte antiscivolo, usa gli armadietti e applica spesso crema solare resistente all'acqua.`,
  },
  {
    title: "Parco Rurale di Anaga: Trekking nella Foresta Preistorica",
    slug: "parco-rurale-anaga",
    category: "natura",
    image_url: "/images/blog/anaga-1.webp",
    image_slug: "anaga-1",
    excerpt:
      "Il Parco Rurale di Anaga conserva una foresta di laurisilva preistorica: sentieri tra nebbie, alberi contorti e villaggi rurali fuori dal tempo.",
    content: `Il Parco Rurale di Anaga, nel nord-est di Tenerife, è uno dei luoghi più magici dell'isola. Conserva una foresta di laurisilva che un tempo ricopriva gran parte dell'Europa meridionale.

## Accessi Principali

- Da La Laguna a Cruz del Carmen (più comune)
- Da Santa Cruz verso la dorsale di Anaga
- Dai paesi costieri (Taganana, Benijo)

## Sentieri Consigliati

1. **Sendero de los Sentidos:** percorsi ad anello facili, adatti a famiglie
2. **Bosque Encantado – El Pijaral:** richiede permesso gratuito, ambiente fiabesco
3. **Afur – Playa di Tamadite – Taganana:** lungo e impegnativo, mix di montagna e costa

## Clima e Attrezzatura

Anaga è spesso coperta da nubi basse. Usa scarpe da trekking e porta una giacca impermeabile.

## Gastronomia Locale

Fermati a Taganana per i ristoranti di pesce, o nei piccoli paesi rurali per formaggi con mojo e puchero.`,
  },
  {
    title:
      "Whale Watching a Tenerife: Guida Etica all'Avvistamento di Balene e Delfini",
    slug: "whale-watching-tenerife",
    category: "natura",
    image_url: "/images/blog/adeje-1.webp",
    image_slug: "adeje-1",
    excerpt:
      "Il mare tra Tenerife e La Gomera è uno dei migliori spot europei per vedere cetacei: globicefali e delfini in un habitat naturale unico.",
    content: `Il tratto di mare tra Tenerife e La Gomera è uno dei migliori spot in Europa per osservare cetacei allo stato libero.

## Porti di Partenza

- **Los Cristianos:** storico porto con numerosi operatori
- **Puerto Colón (Costa Adeje):** base di molti catamarani moderni
- **Los Gigantes:** punto di partenza scenografico

## Scegliere un Operatore Responsabile

Cerca imbarcazioni con il marchio **"Barco Azul"** che garantisce distanze minime dagli animali e visite etiche.

## Tipologie di Tour

- **Tour di 2–3 ore:** perfetti per chi ha poco tempo
- **Tour di mezza giornata (4–5 ore):** con pranzo, bevande e sosta per nuotare

## Cosa Portare

Cappello, crema solare, giacca leggera e macchina fotografica.`,
  },
  {
    title:
      "Masca e il Massiccio del Teno: Strade Vertiginose e Gole Spettacolari",
    slug: "masca-massiccio-teno",
    category: "natura",
    image_url: "/images/blog/masca-valley.jpg",
    image_slug: "masca-valley",
    excerpt:
      "Masca è uno dei paesaggi più scenografici di Tenerife: un villaggio incastonato tra rocce basaltiche con strade vertiginose e gole spettacolari.",
    content: `Masca, nel massiccio del Teno, è uno dei paesaggi più scenografici di Tenerife. Il villaggio sembra incastonato in un anfiteatro naturale di rocce basaltiche.

## Il Villaggio di Masca

Case in pietra con tetti rossi, terrazzamenti coltivati con viti e cactus, bar e ristoranti con viste mozzafiato.

## Il Barranco di Masca

Uno dei trekking più famosi dell'isola. L'accesso è ora regolamentato: prenota in anticipo e rispetta le fasce orarie. Il sentiero è impegnativo con tratti scoscesi.

## Il Parco Rurale del Teno

Strade panoramiche verso Buena Vista del Norte e il Faro del Teno. Mirador con viste sulle scogliere e piccoli paesi rurali tradizionali.`,
  },
  {
    title:
      "Costa Adeje, Las Américas e Los Cristianos: Resort, Spiagge e Nightlife",
    slug: "costa-adeje-las-americas",
    category: "spiagge",
    image_url: "/images/blog/adeje-3.jpg",
    image_slug: "adeje-3",
    excerpt:
      "La fascia costiera sud di Tenerife è il principale polo turistico dell'isola: hotel di ogni categoria, spiagge bellissime, ristoranti e vita notturna.",
    content: `La fascia costiera tra Costa Adeje, Playa de las Américas e Los Cristianos è il principale polo turistico del sud di Tenerife.

## Spiagge Principali

- **Playa de las Vistas (Los Cristianos):** sabbia chiara, mare tranquillo, ideale per famiglie
- **Playa de Troya (Las Américas):** cuore della movida
- **Playa del Duque (Costa Adeje):** atmosfera elegante con boutique hotel

## Attività e Servizi

Sport acquatici, escursioni in barca, whale watching, gite a La Gomera. Shopping nei centri commerciali come Siam Mall o Plaza del Duque.`,
  },
  {
    title: "Puerto de la Cruz: Il Fascino del Nord tra Mare, Giardini e Storia",
    slug: "puerto-de-la-cruz",
    category: "cultura",
    image_url: "/images/blog/puerto-1.webp",
    image_slug: "puerto-1",
    excerpt:
      "Puerto de la Cruz unisce il fascino di un antico porto canario con modernità: il Lago Martiánez di Manrique, la spiaggia nera e il centro storico.",
    content: `Puerto de la Cruz, nella costa nord, unisce il fascino di un antico porto canario con un'anima moderna e turistica.

## Cosa Vedere

- **Lago Martiánez:** piscine di acqua di mare progettate da César Manrique, con opere d'arte integrate
- **Centro Storico:** piazze alberate, vie pedonali, ristoranti tipici
- **Playa Jardín:** spiaggia di sabbia nera con giardini lussureggianti e vista sul Teide

Puerto de la Cruz è anche il punto di partenza per visitare il Loro Parque e la Valle de la Orotava con i suoi giardini storici.`,
  },
  {
    title: "Loro Parque: Parco Faunistico di Riferimento Mondiale",
    slug: "loro-parque",
    category: "divertimento",
    image_url: "/images/blog/loro-parque-1.webp",
    image_slug: "loro-parque-1",
    excerpt:
      "Loro Parque è uno dei parchi faunistici più noti al mondo: pinguini, squali, pappagalli e programmi di conservazione di eccellenza.",
    content: `Loro Parque, a Puerto de la Cruz, è uno dei parchi faunistici più noti al mondo, riconosciuto per i suoi standard di benessere animale.

## Aree Tematiche

- **Planet Penguin:** habitat per pinguini con neve artificiale
- **Aquarium:** tunnel subacquei con squali e pesci tropicali
- **Aviari di pappagalli:** una delle collezioni più ampie al mondo

Dedica almeno una giornata intera: il parco è grande e ricco di spettacoli e aree verdi. È disponibile anche il Twin Ticket abbinato al Siam Park.`,
  },
  {
    title: "Garachico: Rinascita dopo il Vulcano",
    slug: "garachico",
    category: "cultura",
    image_url: "/images/blog/garachico-1.jpg",
    image_slug: "garachico-1",
    excerpt:
      "Garachico è un gioiello storico della costa nord: piscine naturali di lava, centro storico restaurato e una storia di rinascita dopo l'eruzione del 1706.",
    content: `Garachico è un gioiello storico della costa nord. Un'eruzione nel 1706 distrusse il porto e parte della città, ma oggi il paese è magnificamente restaurato.

## Cosa Fare

- Bagno nelle **piscine naturali di El Caletón**, formate dalla lava solidificata
- Passeggiata nel centro storico tra chiese, conventi e palazzi nobiliari
- Salita al mirador per una vista completa su Garachico e sull'isolotto

Garachico è facilmente raggiungibile da Puerto de la Cruz e si abbina bene a una visita al Massiccio del Teno.`,
  },
  {
    title: "La Laguna: Città Universitaria Patrimonio dell'Umanità",
    slug: "la-laguna",
    category: "cultura",
    image_url: "/images/blog/la-laguna-1.jpg",
    image_slug: "la-laguna-1",
    excerpt:
      "San Cristóbal de La Laguna è una città coloniale UNESCO, con un tracciato a griglia che fu modello per molte città latinoamericane.",
    content: `San Cristóbal de La Laguna, vicino a Santa Cruz, è una città coloniale dal tracciato a griglia, modello per molte città dell'America Latina.

## Punti di Interesse

- Cattedrale di La Laguna e numerose chiese storiche
- Vie pedonali con negozi, bar e incontri tra studenti universitari
- Palazzi storici con cortili interni visitabili

La Laguna si raggiunge facilmente dal porto di Santa Cruz con il tram. La città universitaria crea un'atmosfera vivace e cosmopolita che contrasta piacevolmente con le zone turistiche del sud.`,
  },
  {
    title: "Gastronomia di Tenerife: Piatti Tipici e Guachinche",
    slug: "gastronomia-tenerife",
    category: "gastronomia",
    image_url: "/images/blog/eat-1.webp",
    image_slug: "eat-1",
    excerpt:
      "La cucina di Tenerife: papas arrugadas, gofio, mojo, queso asado e i guachinche, locali tradizionali dove vivere un'esperienza gastronomica autentica.",
    content: `La cucina di Tenerife è basata su ingredienti semplici ma genuini, con forti influenze spagnole e latinoamericane.

## Piatti Iconici

- **Papas arrugadas con mojo:** patate novelle in acqua salata con salse al peperoncino o al coriandolo
- **Gofio:** farina di cereali tostati usata in zuppe, dolci o come contorno
- **Queso asado:** formaggio grigliato con mojo
- Stufati di carne, pesce fresco, polpo alla griglia

## Guachinche

I guachinche sono locali tradizionali del nord dove famiglie produttrici di vino servono piatti tipici in un ambiente informale. Sono il luogo perfetto per un'esperienza gastronomica autentica.`,
  },
  {
    title: "Vini di Tenerife: Vitigni Vulcanici",
    slug: "vini-tenerife",
    category: "gastronomia",
    image_url: "/images/blog/vitigni-1.jpg",
    image_slug: "vitigni-1",
    excerpt:
      "Il terreno vulcanico di Tenerife crea vini dalla forte personalità: i vitigni Listán Negro e Listán Blanco danno vini minerali e freschi.",
    content: `Il terreno vulcanico, le differenze di altitudine e il clima mite creano condizioni perfette per vini dalla forte personalità.

## Zone Vitivinicole

- **Tacoronte-Acentejo**
- **Valle de la Orotava**
- **Abona**

I vitigni autoctoni **Listán Negro** e **Listán Blanco** danno vini con note minerali e una marcata freschezza.

## Cantine e Degustazioni

Molte cantine offrono tour, degustazioni e vendita diretta. Abbina la visita a un guachinche per un'esperienza completa della cultura enogastronomica locale.`,
  },
  {
    title: "Spiagge di Tenerife: Nere, Dorate e Selvagge",
    slug: "spiagge-tenerife",
    category: "spiagge",
    image_url: "/images/blog/playa-1.jpg",
    image_slug: "playa-1",
    excerpt:
      "Tenerife offre spiagge incredibili: sabbia dorata del Sahara a Las Teresitas, sabbia nera vulcanica a Playa Jardín, e calette selvagge ad Anaga.",
    content: `Tenerife offre una varietà incredibile di spiagge:

## Le Spiagge Principali

- **Las Teresitas (vicino a Santa Cruz):** sabbia dorata importata dal Sahara, mare calmo, ideale per famiglie
- **Playa Jardín (Puerto de la Cruz):** sabbia nera vulcanica con giardini progettati da César Manrique
- **El Médano:** lunga spiaggia ventosa, paradiso di kitesurf e windsurf
- **Playa del Duque:** spiaggia elegante con strutture di lusso
- **Playa de las Teresitas:** la più famosa del nord

## Spiagge Selvagge

Calette e spiagge selvagge punteggiano tutta la costa, soprattutto nella zona di Anaga (Playa de Benijo, Playa de Almáciga) e Teno.`,
  },
  {
    title: "Santa Cruz de Tenerife: Vita Urbana tra Porto e Cultura",
    slug: "santa-cruz-tenerife",
    category: "cultura",
    image_url: "/images/blog/santacruz-1.jpg",
    image_slug: "santacruz-1",
    excerpt:
      "Santa Cruz è la capitale di Tenerife: shopping, l'Auditorium di Calatrava, il Parque García Sanabria e una scena culturale vivace.",
    content: `Santa Cruz è la capitale amministrativa dell'isola, una città moderna con grandi viali, parchi e una scena culturale vivace.

## Cosa Fare

- Shopping nella zona centrale (Calle Castillo e dintorni)
- Visita all'**Auditorium di Tenerife**, progettato da Santiago Calatrava
- Relax nel **Parque García Sanabria**, grande parco urbano con sculture
- Connessione con La Laguna con il moderno tram

## Musei e Cultura

Il Museo della Natura e dell'Uomo ospita le più importanti collezioni delle Isole Canarie, incluse le mummie Guanche. Il Parco Marittimo offre piscine di acqua marina con vista sul porto.`,
  },
  {
    title: "Carnevale di Santa Cruz: Esplosione di Colori e Musica",
    slug: "carnevale-santa-cruz",
    category: "cultura",
    image_url: "/images/blog/carneval-1.jpg",
    image_slug: "carneval-1",
    excerpt:
      "Il Carnevale di Santa Cruz è uno dei più grandi al mondo, paragonato a quello di Rio: costumi spettacolari, musica e festa continua per settimane.",
    content: `Il Carnevale di Santa Cruz è uno dei più grandi e famosi al mondo, spesso paragonato a quello di Rio de Janeiro.

## Eventi Principali

- **Gala de Elección de la Reina:** sfilata di costumi alti diversi metri e pesanti decine di chili
- **Cabalgata Anunciadora:** grande sfilata inaugurale
- **Coso Apoteosis:** parata finale con carri, ballerini e musica

Durante il carnevale la città si trasforma in una festa continua con musica, balli e gente mascherata per le strade fino all'alba. L'evento dura diverse settimane di solito a febbraio.`,
  },
  {
    title:
      "Clima e Microclimi di Tenerife: Dove Alloggiare in Base alle Tue Esigenze",
    slug: "clima-microclimi-tenerife",
    category: "pratiche",
    image_url: "/images/blog/villa-1.webp",
    image_slug: "villa-1",
    excerpt:
      "Tenerife ha microclimi molto diversi: dalla siccità soleggiata del sud alla verde umidità del nord. Scopri dove alloggiare in base alle tue preferenze.",
    content: `Tenerife è famosa come "l'isola dell'eterna primavera", ma presenta microclimi molto diversi tra nord, sud, costa e interno.

## Nord vs Sud

- **Sud (Costa Adeje, Las Américas, Los Cristianos):** più secco, soleggiato e caldo tutto l'anno. Ideale per mare, sole e resort.
- **Nord (Puerto de la Cruz, La Orotava):** più umido e verde, temperature leggermente più fresche.

Scegli il nord se ami paesaggi verdi; scegli il sud se priorità assoluta è il bel tempo da spiaggia.

## Fasce Altitudinali

- **Costa (0-400 m):** clima mite tutto l'anno
- **Zona media (400-1500 m):** foreste di pino, temperature fresche la sera
- **Alta quota (1500-3718 m):** clima alpino, possibile neve in inverno`,
  },
  {
    title: "Outdoor e Sport a Tenerife: Trekking, MTB e Parapendio",
    slug: "outdoor-sport-tenerife",
    category: "sport",
    image_url: "/images/blog/parapendio-1.jpg",
    image_slug: "parapendio-1",
    excerpt:
      "Tenerife è un parco giochi per gli sportivi: trekking al Teide e ad Anaga, MTB su sterrati, parapendio con decolli famosi e atterraggi sulla costa.",
    content: `Tenerife è un parco giochi all'aria aperta per appassionati di sport.

## Trekking

Il Teide, Anaga e Teno offrono sentieri per tutti i livelli: dai percorsi familiari del Sendero de los Sentidos alle salite impegnative all'Alta Vía di Tenerife.

## MTB (Mountain Bike)

Percorsi sterrati in zone interne e forestali. Diverse scuole noleggiamo bici e organizzano escursioni guidate.

## Parapendio

Decolli famosi nei pressi di Adeje, Güímar e Izaña, con atterraggi sulla costa. Le condizioni termiche dell'isola sono ideali per il volo.

## Altri Sport

- Surf e kitesurf a El Médano
- Immersioni sub ad Abades e Las Galletas
- Kayak e paddle surf nelle calette del nord`,
  },
  {
    title: "Escursioni alle Isole Vicine: La Gomera, La Palma ed El Hierro",
    slug: "escursioni-isole-vicine",
    category: "natura",
    image_url: "/images/blog/gomera-1.avif",
    image_slug: "gomera-1",
    excerpt:
      "Da Tenerife puoi raggiungere facilmente le isole sorelle: La Gomera verde, La Palma stellare e vulcanica, El Hierro paradiso delle immersioni.",
    content: `Da Tenerife puoi raggiungere facilmente altre isole delle Canarie in traghetto o volo interno.

## La Gomera

Natura lussureggiante, Parco Nazionale di Garajonay (UNESCO), villaggi tradizionali e il famoso Silbo Gomero (fischio tradizionale). Traghetto da Los Cristianos: 35-50 minuti.

## La Palma

Nota per i suoi cieli stellati (Riserva Starlight), vulcani recenti e foreste. La Ruta de los Volcanes è uno dei trekking più spettacolari delle Canarie.

## El Hierro

La più piccola e meno turistica delle Canarie. Paradiso per immersioni nella Riserva Marina, turismo slow e paesaggi vulcanici unici. Patrimonio della Biosfera UNESCO.`,
  },
  {
    title: "Tenerife con Bambini: Parchi, Spiagge e Attività Family-Friendly",
    slug: "tenerife-bambini-family",
    category: "famiglia",
    image_url: "/images/blog/kidsactivity-1.jpg",
    image_slug: "kidsactivity-1",
    excerpt:
      "Tenerife è ideale per famiglie con bambini: Siam Park e Loro Parque, spiagge con acque calme, trekking facili e hotel con miniclub e piscine dedicate.",
    content: `Tenerife è una meta ideale per famiglie grazie a una combinazione perfetta di attrazioni, spiagge e servizi.

## Parchi Tematici

- **Siam Park:** il parco acquatico numero uno al mondo con aree dedicate ai più piccoli
- **Loro Parque:** pinguini, orche, squali e giardini tropicali
- **Jungle Park:** parco naturale con aquile, pappagalli e scivoli nella natura

## Spiagge Family-Friendly

- **Playa de las Vistas:** mare calmo e piatto, bagnini, docce e accessibile
- **Playa del Duque:** servizi ottimi e mare tranquillo
- **Las Teresitas:** sabbia dorata e acque protette da una diga naturale

## Attività per Famiglie

- Sendero de los Sentidos ad Anaga (percorso sensoriale per bambini)
- Whale watching con tour adatti ai bambini
- Visita al Parco Nazionale del Teide con la funivia`,
  },
  {
    title:
      "Vivere a Tenerife: Nomade Digitale, Pensionato e Itinerari 3/5/7 Giorni",
    slug: "vivere-tenerife-itinerari",
    category: "pratiche",
    image_url: "/images/blog/villa-5.avif",
    image_slug: "villa-5",
    excerpt:
      "Sempre più persone scelgono Tenerife per viverci: costo della vita accessibile, clima mite, internet veloce. Più gli itinerari ideali da 3, 5 e 7 giorni.",
    content: `Sempre più persone scelgono Tenerife per trasferirsi o trascorrere lunghi periodi come nomadi digitali o pensionati.

## Vivere a Tenerife

- Costo della vita inferiore rispetto a molte città del Nord Europa
- Clima mite tutto l'anno, ideale per benessere fisico e mentale
- Buona infrastruttura di internet, coworking e servizi
- Comunità internazionale numerosa, specialmente nel sud

## Itinerario 3 Giorni

- **Giorno 1:** Sud (Costa Adeje, Playa del Duque, tramonto)
- **Giorno 2:** Teide (funivia, Roques de García)
- **Giorno 3:** Whale watching e relax in spiaggia

## Itinerario 5 Giorni

Aggiungi Puerto de la Cruz, Loro Parque e un'escursione ad Anaga.

## Itinerario 7 Giorni

Giro quasi completo: Masca, Garachico, La Laguna, Santa Cruz e gita in traghetto a La Gomera.`,
  },
];

// ---------- Main ----------

async function seed() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();

    console.log("🔄 Syncing models (creating tables)...");
    await sequelize.sync({ force: true });
    console.log("✅ Tables created");

    // Create admin user
    const hashedPw = await bcrypt.hash("admin123", 10);
    const admin = await User.create({
      email: "admin@tenerife.com",
      full_name: "Admin Tenerife",
      hashed_password: hashedPw,
      is_active: true,
      is_admin: true,
      language: "it",
    } as any);
    console.log(
      `✅ Admin user created: admin@tenerife.com (password: admin123)`,
    );

    // Create test user
    const userPw = await bcrypt.hash("user123", 10);
    await User.create({
      email: "user@tenerife.com",
      full_name: "Utente Test",
      hashed_password: userPw,
      is_active: true,
      is_admin: false,
      language: "it",
    } as any);
    console.log(`✅ Test user created: user@tenerife.com (password: user123)`);

    // Create articles
    const now = new Date();
    for (let i = 0; i < articles.length; i++) {
      const art = articles[i];
      const d = new Date(now);
      d.setDate(d.getDate() - (articles.length - i) * 3); // spread over time
      await Article.create({
        ...art,
        language: "it",
        is_published: true,
        author_id: (admin as any).id,
        images: JSON.stringify([art.image_url]),
        created_at: d,
      } as any);
    }
    console.log(`✅ ${articles.length} articles created`);

    console.log("\n🎉 Seed completed successfully!");
    console.log(`📁 Database: ${dbPath}`);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
