/**
 * companiesDB.js — Base de datos de empresas AVANZZA
 * Datos extraídos de las Fichas Técnicas proporcionadas por Patricia Sarai B.
 *
 * FRONTINGS: Empresas clientes (Receptores en el CFDI)
 * EMISORES_CONOCIDOS: Proveedores de segunda base (Emisores en el CFDI)
 */

// ─── Emisores conocidos (proveedores / segunda base) ──────────────────────────

export const EMISORES_CONOCIDOS = [
  {
    nombre: "Infraestructura y Materiales Crea, S.A. de C.V.",
    rfc: "IMC240227MX5",
    domicilio: "Calle Melquiades Campos, exterior 3152, Col. Santa Cecilia 1ra Sección, C.P. 44700, Guadalajara, Jalisco",
    regimen: "601",
    cp: "44700",
  },
  {
    nombre: "Industrias Letkonto, S.A. de C.V.",
    rfc: "",
    domicilio: "",
    regimen: "601",
    cp: "",
  },
  {
    nombre: "Comercio Global Ediguan, S.A. de C.V.",
    rfc: "",
    domicilio: "",
    regimen: "601",
    cp: "",
  },
  {
    nombre: "Nidifaquetur, S.A. de C.V.",
    rfc: "",
    domicilio: "",
    regimen: "601",
    cp: "",
  },
  {
    nombre: "Distribuidora Sanders, S.A. de C.V.",
    rfc: "",
    domicilio: "",
    regimen: "601",
    cp: "",
  },
  {
    nombre: "Pegghu Magno Obras, S.A.",
    rfc: "",
    domicilio: "",
    regimen: "601",
    cp: "",
  },
  {
    nombre: "Boyavele Construcciones, S.A. de C.V.",
    rfc: "",
    domicilio: "",
    regimen: "601",
    cp: "",
  },
  {
    nombre: "Angana Construccion y Adecuacion de Espacios Innovadores, S.A. de C.V.",
    rfc: "",
    domicilio: "",
    regimen: "601",
    cp: "",
  },
  {
    nombre: "Corporativo de Ventas Zamky, S.A. de C.V.",
    rfc: "",
    domicilio: "",
    regimen: "601",
    cp: "",
  },
  {
    nombre: "María Bonita Accesorios, S.A. de C.V.",
    rfc: "",
    domicilio: "",
    regimen: "601",
    cp: "",
  },
  {
    nombre: "Daniel Santillán",
    rfc: "",
    domicilio: "",
    regimen: "605",
    cp: "",
  },
];

// ─── Frontings (clientes / receptores) ───────────────────────────────────────
// tipo: "servicios" | "insumos" | "materiales" | "ambos"

export const FRONTINGS = [
  {
    id: "goteborg",
    rfc: "GOT211208L5A",
    nombre: "Goteborg, S.A. de C.V.",
    domicilio: "Calle Ramón Corona, exterior #663, interior B, Col. Santa Anita, Tlajomulco de Zúñiga, Jalisco",
    regimen: "601",
    cp: "45645",
    rubro: "Construcción y obra civil",
    tipo: "ambos",
    proveedores: [
      "Pegghu Magno Obras, S.A.",
      "Boyavele Construcciones, S.A. de C.V.",
      "Angana Construccion y Adecuacion de Espacios Innovadores, S.A. de C.V.",
      "Infraestructura y Materiales Crea, S.A. de C.V.",
    ],
    entregables: {
      solicitud_servicios:
        "El cliente (Goteborg, S.A. de C.V.) interactúa con las siguientes empresas: Pegghu Magno Obras S.A., Boyavele Construcciones S.A. de C.V., Angana Construccion y Adecuacion de Espacios Innovadores S.A. de C.V., e Infraestructura y Materiales Crea S.A. de C.V. El cliente les solicita sus servicios de construcción y obra civil de manera escrita.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose de costos del servicio/s solicitados y una narrativa descriptiva de en qué consisten.",
      aceptacion_servicios:
        "El cliente acepta la cotización formulada por alguna de las empresas y generan una bitácora en la que describen el/los servicios y el costo final (orden de compra).",
      bitacora_supervision:
        "Tabla en la cual se desglosa todo el servicio y cómo ha sido gestionado y realizado por la empresa responsable para que se lleve a cabo en su totalidad; debe estar firmado por la empresa y el cliente.",
      recepcion_trabajo:
        "Consta de un escrito detallado en el que se da por finalizado el servicio y lo entregado.",
      solicitud_insumos:
        "El cliente (Goteborg, S.A. de C.V.) solicita de manera escrita el suministro de materiales a las empresas con las que interactúa: Pegghu Magno Obras S.A., Boyavele Construcciones S.A. de C.V., Angana Construccion y Adecuacion de Espacios Innovadores S.A. de C.V., e Infraestructura y Materiales Crea S.A. de C.V.",
      aceptacion_insumos:
        "El cliente acepta la cotización realizada por alguna de las empresas y genera una bitácora en la que describe el material próximo a adquirir, añadiendo el costo final (orden de compra).",
      ficha_entrega:
        "La empresa generará una ficha en la que informa qué productos entregó al cliente, el domicilio, la fecha de entrega, a quién fue entregado y los datos generales del cliente.",
    },
  },
  {
    id: "contratus",
    rfc: "AJC2402279P2",
    nombre: "Contratus, S.A. de C.V.",
    domicilio: "Av. Cuauhtémoc, exterior 714, Col. Ciudad del Sol, C.P. 45050, Zapopan, Jalisco",
    regimen: "601",
    cp: "45050",
    rubro: "Servicios profesionales (consultoría, asesoría)",
    tipo: "servicios",
    proveedores: [
      "Industrias Letkonto, S.A. de C.V.",
    ],
    entregables: {
      solicitud_servicios:
        "El cliente (Contratus, S.A. de C.V.) interactúa con la empresa Industrias Letkonto S.A. de C.V., enviándole una solicitud escrita de sus servicios.",
      cotizacion:
        "La empresa con la que interactúa el cliente acepta la solicitud y realiza un desglose de costos del servicio/s solicitados y una narrativa descriptiva de en qué consisten.",
      aceptacion_servicios:
        "El cliente acepta la cotización formulada por la empresa y genera una bitácora en la que describe el/los servicios y el costo final (orden de compra).",
      bitacora_supervision:
        "Tabla en la cual se desglosa todo el servicio y cómo ha sido gestionado y realizado por la empresa responsable para que se lleve a cabo en su totalidad; debe estar firmado por la empresa y el cliente.",
      recepcion_trabajo:
        "Consta de un escrito detallado en el que se da por finalizado el servicio y lo entregado.",
    },
  },
  {
    id: "apxus",
    rfc: "PAP2309159L0",
    nombre: "Publicity Apxus, S.A. de C.V.",
    domicilio: "Av. Niños Heroes, exterior 2716, Interior 109, Col. Jardines del Bosque Centro, C.P. 44520, Guadalajara, Jalisco",
    regimen: "601",
    cp: "44520",
    rubro: "Publicidad y marketing",
    tipo: "insumos",
    proveedores: [
      "Industrias Letkonto, S.A. de C.V.",
      "Comercio Global Ediguan, S.A. de C.V.",
    ],
    entregables: {
      solicitud_insumos:
        "El cliente (Publicity Apxus, S.A. de C.V.) interactúa con las siguientes empresas: Industrias Letkonto S.A. de C.V. y Comercio Global Ediguan S.A. de C.V., de quienes solicita de manera escrita el suministro de insumos.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose detallado de los materiales que les fueron solicitados, así como de los costos y cantidades.",
      aceptacion_insumos:
        "El cliente acepta la cotización realizada por alguna de las empresas y genera una bitácora en la que describe el material próximo a adquirir, añadiendo el costo final (orden de compra).",
      ficha_entrega:
        "La empresa generará una ficha en la que informa qué productos entregó al cliente, el domicilio, la fecha de entrega, a quién fue entregado y los datos generales del cliente.",
    },
  },
  {
    id: "ecotrust",
    rfc: "ESO230324P55",
    nombre: "Ecotrust Solis, S.A. de C.V.",
    domicilio: "Calle Melquiades Campos, exterior 3152, Col. Santa Cecilia 1ra Sección, C.P. 44700, Guadalajara, Jalisco",
    regimen: "601",
    cp: "44700",
    rubro: "Manufactura e industria",
    tipo: "insumos",
    proveedores: [
      "Industrias Letkonto, S.A. de C.V.",
      "Daniel Santillán",
      "Nidifaquetur, S.A. de C.V.",
    ],
    entregables: {
      solicitud_insumos:
        "El cliente (Ecotrust Solis, S.A. de C.V.) interactúa con las siguientes empresas: Industrias Letkonto S.A. de C.V., Daniel Santillán y Nidifaquetur S.A. de C.V., de quienes solicita de manera escrita el suministro de insumos.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose detallado de los materiales que les fueron solicitados, así como de los costos y cantidades.",
      aceptacion_insumos:
        "El cliente acepta la cotización realizada por alguna de las empresas y genera una bitácora en la que describe el material próximo a adquirir, añadiendo el costo final (orden de compra).",
      ficha_entrega:
        "La empresa generará una ficha en la que informa qué productos entregó al cliente, el domicilio, la fecha de entrega, a quién fue entregado y los datos generales del cliente.",
    },
  },
  {
    id: "gomers",
    rfc: "PIG220503IV8",
    nombre: "Proveedora de Insumos Gomers, S.A. de C.V.",
    domicilio: "Calle Aceituna, exterior 1902, Interior Bodega 1, Col. Las Torres, C.P. 44920, Guadalajara, Jalisco",
    regimen: "601",
    cp: "44920",
    rubro: "Comercio al por mayor",
    tipo: "servicios",
    proveedores: [
      "Distribuidora Sanders, S.A. de C.V.",
      "Nidifaquetur, S.A. de C.V.",
    ],
    entregables: {
      solicitud_servicios:
        "El cliente (Proveedora de Insumos Gomers, S.A. de C.V.) interactúa con las siguientes empresas: Distribuidora Sanders S.A. de C.V. y Nidifaquetur S.A. de C.V., enviándoles una solicitud escrita de sus servicios.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose de costos del servicio/s solicitados y una narrativa descriptiva de en qué consisten.",
      aceptacion_servicios:
        "El cliente acepta la cotización formulada por alguna de las empresas y genera una bitácora en la que describe el/los servicios y el costo final (orden de compra).",
      bitacora_supervision:
        "Tabla en la cual se desglosa todo el servicio y cómo ha sido gestionado y realizado por la empresa responsable para que se lleve a cabo en su totalidad; debe estar firmado por la empresa y el cliente.",
      recepcion_trabajo:
        "Consta de un escrito detallado en el que se da por finalizado el servicio y lo entregado.",
    },
  },
  {
    id: "industrimant",
    rfc: "IND240418GW4",
    nombre: "Industrimant, S.A. de C.V.",
    domicilio: "Calle Isla Bilot, exterior 3950, Col. Vicente Guerrero, C.P. 44987, Guadalajara, Jalisco",
    regimen: "601",
    cp: "44987",
    rubro: "Manufactura e industria",
    tipo: "materiales",
    proveedores: [
      "Industrias Letkonto, S.A. de C.V.",
      "Comercio Global Ediguan, S.A. de C.V.",
      "Nidifaquetur, S.A. de C.V.",
    ],
    entregables: {
      solicitud_insumos:
        "El cliente (Industrimant, S.A. de C.V.) interactúa con las siguientes empresas: Industrias Letkonto S.A. de C.V., Comercio Global Ediguan S.A. de C.V. y Nidifaquetur S.A. de C.V., solicitando de manera escrita materiales e insumos para su proceso productivo.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose de costos del servicio/s o productos solicitados y una narrativa descriptiva de en qué consisten.",
      aceptacion_insumos:
        "El cliente acepta la cotización realizada por alguna de las empresas y genera una bitácora en la que describe el material próximo a adquirir, añadiendo el costo final (orden de compra).",
      ficha_entrega:
        "La empresa generará una ficha en la que informa qué productos entregó al cliente, el domicilio, la fecha de entrega, a quién fue entregado y los datos generales del cliente.",
    },
  },
  {
    id: "medicina_vida_sana",
    rfc: "MVS240227EW0",
    nombre: "Medicina y Vida Sana, S.A. de C.V.",
    domicilio: "Calle Porfirio Díaz, exterior 593, Col. San Juan Bosco, C.P. 44730, Guadalajara, Jalisco",
    regimen: "601",
    cp: "44730",
    rubro: "Salud y farmacéutica",
    tipo: "servicios",
    proveedores: [
      "Industrias Letkonto, S.A. de C.V.",
      "Corporativo de Ventas Zamky, S.A. de C.V.",
    ],
    entregables: {
      solicitud_servicios:
        "El cliente (Medicina y Vida Sana, S.A. de C.V.) interactúa con las siguientes empresas: Industrias Letkonto S.A. de C.V. y Corporativo de Ventas Zamky S.A. de C.V., a quienes de manera escrita les solicita servicios.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose de costos del servicio/s solicitados y una narrativa descriptiva de en qué consisten.",
      aceptacion_servicios:
        "El cliente acepta la cotización formulada por alguna de las empresas y genera una bitácora en la que describe el/los servicios y el costo final (orden de compra).",
      bitacora_supervision:
        "Tabla en la cual se desglosa todo el servicio y cómo ha sido gestionado y realizado por la empresa responsable para que se lleve a cabo en su totalidad; debe estar firmado por la empresa y el cliente.",
      recepcion_trabajo:
        "Consta de un escrito detallado en el que se da por finalizado el servicio y lo entregado.",
    },
  },
  {
    id: "mezver",
    rfc: "CME130426S46",
    nombre: "Comercializadora Mezver, S.R.L. de C.V.",
    domicilio: "Carretera Libramiento el Salto, exterior 100, Col. La Alcantarilla, C.P. 45680, El Salto, Jalisco",
    regimen: "601",
    cp: "45680",
    rubro: "Comercio al por mayor",
    tipo: "servicios",
    proveedores: [
      "Industrias Letkonto, S.A. de C.V.",
      "Nidifaquetur, S.A. de C.V.",
      "Daniel Santillán",
    ],
    entregables: {
      solicitud_servicios:
        "El cliente (Comercializadora Mezver, S.R.L. de C.V.) interactúa con las siguientes empresas: Industrias Letkonto S.A. de C.V., Nidifaquetur S.A. de C.V. y Daniel Santillán, a quienes de manera escrita les solicita servicios.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose de costos del servicio/s solicitados y una narrativa descriptiva de en qué consisten.",
      aceptacion_servicios:
        "El cliente acepta la cotización formulada por alguna de las empresas y genera una bitácora en la que describe el/los servicios y el costo final (orden de compra).",
      bitacora_supervision:
        "Tabla en la cual se desglosa todo el servicio y cómo ha sido gestionado y realizado por la empresa responsable para que se lleve a cabo en su totalidad; debe estar firmado por la empresa y el cliente.",
      recepcion_trabajo:
        "Consta de un escrito detallado en el que se da por finalizado el servicio y lo entregado.",
    },
  },
  {
    id: "mil_calles",
    rfc: "LMC221024PL5",
    nombre: "Logística Mil Calles, S.A. de C.V.",
    domicilio: "Calle Astros, exterior 321, Col. Jardines del Bosque Centro, C.P. 44520, Guadalajara, Jalisco",
    regimen: "601",
    cp: "44520",
    rubro: "Transporte y logística de mercancías",
    tipo: "servicios",
    proveedores: [
      "Industrias Letkonto, S.A. de C.V.",
      "Comercio Global Ediguan, S.A. de C.V.",
      "Nidifaquetur, S.A. de C.V.",
    ],
    entregables: {
      solicitud_servicios:
        "El cliente (Logística Mil Calles, S.A. de C.V.) interactúa con las siguientes empresas: Industrias Letkonto S.A. de C.V., Comercio Global Ediguan S.A. de C.V. y Nidifaquetur S.A. de C.V., enviándoles una solicitud escrita de sus servicios.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose de costos del servicio/s solicitados y una narrativa descriptiva de en qué consisten.",
      aceptacion_servicios:
        "El cliente acepta la cotización formulada por alguna de las empresas y genera una bitácora en la que describe el/los servicios y el costo final (orden de compra).",
      bitacora_supervision:
        "Tabla en la cual se desglosa todo el servicio y cómo ha sido gestionado y realizado por la empresa responsable para que se lleve a cabo en su totalidad; debe estar firmado por la empresa y el cliente.",
      recepcion_trabajo:
        "Consta de un escrito detallado en el que se da por finalizado el servicio y lo entregado.",
    },
  },
  {
    id: "pilingert",
    rfc: "ACP240926B88",
    nombre: "Acabados para la Construcción Pilingert, S.A. de C.V.",
    domicilio: "Calle Volcán Momotombo, exterior 1200, Col. El Colli Urbano 1ra Sección, Zapopan, Jalisco",
    regimen: "601",
    cp: "45065",
    rubro: "Construcción y obra civil",
    tipo: "servicios",
    proveedores: [
      "Boyavele Construcciones, S.A. de C.V.",
      "Infraestructura y Materiales Crea, S.A. de C.V.",
    ],
    entregables: {
      solicitud_servicios:
        "El cliente (Acabados para la Construcción Pilingert, S.A. de C.V.) interactúa con las siguientes empresas: Boyavele Construcciones S.A. de C.V. e Infraestructura y Materiales Crea S.A. de C.V., enviándoles una solicitud escrita de sus servicios.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose de costos del servicio/s solicitados y una narrativa descriptiva de en qué consisten.",
      aceptacion_servicios:
        "El cliente acepta la cotización formulada por alguna de las empresas y genera una bitácora en la que describe el/los servicios y el costo final (orden de compra).",
      bitacora_supervision:
        "Tabla en la cual se desglosa todo el servicio y cómo ha sido gestionado y realizado por la empresa responsable para que se lleve a cabo en su totalidad; debe estar firmado por la empresa y el cliente.",
      recepcion_trabajo:
        "Consta de un escrito detallado en el que se da por finalizado el servicio y lo entregado.",
    },
  },
  {
    id: "qarma",
    rfc: "QHN240418SC8",
    nombre: "Qarma Hd Nets, S.A. de C.V.",
    domicilio: "Av. Tepeyac, exterior 4038, Col. Ciudad de los Niños, C.P. 45040, Zapopan, Jalisco",
    regimen: "601",
    cp: "45040",
    rubro: "Tecnología de la información y software",
    tipo: "servicios",
    proveedores: [
      "Industrias Letkonto, S.A. de C.V.",
      "Nidifaquetur, S.A. de C.V.",
      "Comercio Global Ediguan, S.A. de C.V.",
    ],
    entregables: {
      solicitud_servicios:
        "El cliente (Qarma Hd Nets, S.A. de C.V.) interactúa con las siguientes empresas: Industrias Letkonto S.A. de C.V., Nidifaquetur S.A. de C.V. y Comercio Global Ediguan S.A. de C.V., a quienes de manera escrita les solicita servicios.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose de costos del servicio/s solicitados y una narrativa descriptiva de en qué consisten.",
      aceptacion_servicios:
        "El cliente acepta la cotización formulada por alguna de las empresas y genera una bitácora en la que describe el/los servicios y el costo final (orden de compra).",
      bitacora_supervision:
        "Tabla en la cual se desglosa todo el servicio y cómo ha sido gestionado y realizado por la empresa responsable para que se lleve a cabo en su totalidad; debe estar firmado por la empresa y el cliente.",
      recepcion_trabajo:
        "Consta de un escrito detallado en el que se da por finalizado el servicio y lo entregado.",
    },
  },
  {
    id: "roccar",
    rfc: "MIU240227FC8",
    nombre: "Materiales Integrales y Urbanización Roccar, S.A. de C.V.",
    domicilio: "Calle Volcán Momotombo, exterior 1200, Col. El Colli Urbano 1ra Sección, Zapopan, Jalisco",
    regimen: "601",
    cp: "45065",
    rubro: "Construcción y obra civil",
    tipo: "ambos",
    proveedores: [
      "Pegghu Magno Obras, S.A.",
      "Boyavele Construcciones, S.A. de C.V.",
      "Angana Construccion y Adecuacion de Espacios Innovadores, S.A. de C.V.",
      "Infraestructura y Materiales Crea, S.A. de C.V.",
    ],
    entregables: {
      solicitud_servicios:
        "El cliente (Materiales Integrales y Urbanización Roccar, S.A. de C.V.) interactúa con las siguientes empresas: Pegghu Magno Obras S.A., Boyavele Construcciones S.A. de C.V., Angana Construccion y Adecuacion de Espacios Innovadores S.A. de C.V., e Infraestructura y Materiales Crea S.A. de C.V., enviándoles una solicitud escrita de sus servicios.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose de costos del servicio/s solicitados y una narrativa descriptiva de en qué consisten.",
      aceptacion_servicios:
        "El cliente acepta la cotización formulada por alguna de las empresas y genera una bitácora en la que describe el/los servicios y el costo final (orden de compra).",
      bitacora_supervision:
        "Tabla en la cual se desglosa todo el servicio y cómo ha sido gestionado y realizado por la empresa responsable para que se lleve a cabo en su totalidad; debe estar firmado por la empresa y el cliente.",
      recepcion_trabajo:
        "Consta de un escrito detallado en el que se da por finalizado el servicio y lo entregado.",
      solicitud_insumos:
        "El cliente (Materiales Integrales y Urbanización Roccar, S.A. de C.V.) solicita de manera escrita el suministro de materiales de construcción a las empresas con las que interactúa.",
      aceptacion_insumos:
        "El cliente acepta la cotización realizada por alguna de las empresas y genera una bitácora en la que describe el material próximo a adquirir, añadiendo el costo final (orden de compra).",
      ficha_entrega:
        "La empresa generará una ficha en la que informa qué productos entregó al cliente, el domicilio, la fecha de entrega, a quién fue entregado y los datos generales del cliente.",
    },
  },
  {
    id: "salud_tule",
    rfc: "SVT2210259T0",
    nombre: "Salud y Vida el Tule, S.A. de C.V.",
    domicilio: "Calle Porfirio Díaz, exterior 593, Col. San Juan Bosco, C.P. 44730, Guadalajara, Jalisco",
    regimen: "601",
    cp: "44730",
    rubro: "Salud y farmacéutica",
    tipo: "servicios",
    proveedores: [
      "Industrias Letkonto, S.A. de C.V.",
      "Corporativo de Ventas Zamky, S.A. de C.V.",
    ],
    entregables: {
      solicitud_servicios:
        "El cliente (Salud y Vida el Tule, S.A. de C.V.) interactúa con las siguientes empresas: Industrias Letkonto S.A. de C.V. y Corporativo de Ventas Zamky S.A. de C.V., a quienes de manera escrita les solicita servicios.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose de costos del servicio/s solicitados y una narrativa descriptiva de en qué consisten.",
      aceptacion_servicios:
        "El cliente acepta la cotización formulada por alguna de las empresas y genera una bitácora en la que describe el/los servicios y el costo final (orden de compra).",
      bitacora_supervision:
        "Tabla en la cual se desglosa todo el servicio y cómo ha sido gestionado y realizado por la empresa responsable para que se lleve a cabo en su totalidad; debe estar firmado por la empresa y el cliente.",
      recepcion_trabajo:
        "Consta de un escrito detallado en el que se da por finalizado el servicio y lo entregado.",
    },
  },
  {
    id: "sound_soul",
    rfc: "SSE230228B8",
    nombre: "Sound and Soul Experiences, S.A. de C.V.",
    domicilio: "Calle Rayo, exterior 2723, Interior 3, Col. Jardines del Bosque Centro, C.P. 44520, Guadalajara, Jalisco",
    regimen: "601",
    cp: "44520",
    rubro: "Publicidad y marketing",
    tipo: "insumos",
    proveedores: [
      "Industrias Letkonto, S.A. de C.V.",
      "María Bonita Accesorios, S.A. de C.V.",
      "Comercio Global Ediguan, S.A. de C.V.",
    ],
    entregables: {
      solicitud_insumos:
        "El cliente (Sound and Soul Experiences, S.A. de C.V.) interactúa con las siguientes empresas: Industrias Letkonto S.A. de C.V., María Bonita Accesorios S.A. de C.V. y Comercio Global Ediguan S.A. de C.V., de quienes solicita de manera escrita el suministro de insumos.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose detallado de los materiales que les fueron solicitados, así como de los costos y cantidades.",
      aceptacion_insumos:
        "El cliente acepta la cotización realizada por alguna de las empresas y genera una bitácora en la que describe el material próximo a adquirir, añadiendo el costo final (orden de compra).",
      ficha_entrega:
        "La empresa generará una ficha en la que informa qué productos entregó al cliente, el domicilio, la fecha de entrega, a quién fue entregado y los datos generales del cliente.",
    },
  },
  {
    id: "steel",
    rfc: "TCS221024559",
    nombre: "Tegno Construcción Steel, S.A. de C.V.",
    domicilio: "Calle Ramón Corona, exterior #663, interior B, Col. Santa Anita, Tlajomulco de Zúñiga, Jalisco",
    regimen: "601",
    cp: "45645",
    rubro: "Construcción y obra civil",
    tipo: "ambos",
    proveedores: [
      "Pegghu Magno Obras, S.A.",
      "Boyavele Construcciones, S.A. de C.V.",
      "Angana Construccion y Adecuacion de Espacios Innovadores, S.A. de C.V.",
      "Infraestructura y Materiales Crea, S.A. de C.V.",
    ],
    entregables: {
      solicitud_servicios:
        "El cliente (Tegno Construcción Steel, S.A. de C.V.) interactúa con las siguientes empresas: Pegghu Magno Obras S.A., Boyavele Construcciones S.A. de C.V., Angana Construccion y Adecuacion de Espacios Innovadores S.A. de C.V., e Infraestructura y Materiales Crea S.A. de C.V., enviándoles una solicitud escrita de sus servicios de construcción.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose de costos del servicio/s solicitados y una narrativa descriptiva de en qué consisten.",
      aceptacion_servicios:
        "El cliente acepta la cotización formulada por alguna de las empresas y genera una bitácora en la que describe el/los servicios y el costo final (orden de compra).",
      bitacora_supervision:
        "Tabla en la cual se desglosa todo el servicio y cómo ha sido gestionado y realizado por la empresa responsable para que se lleve a cabo en su totalidad; debe estar firmado por la empresa y el cliente.",
      recepcion_trabajo:
        "Consta de un escrito detallado en el que se da por finalizado el servicio y lo entregado.",
      solicitud_insumos:
        "El cliente (Tegno Construcción Steel, S.A. de C.V.) solicita de manera escrita el suministro de materiales de construcción a las empresas con las que interactúa.",
      aceptacion_insumos:
        "El cliente acepta la cotización realizada por alguna de las empresas y genera una bitácora en la que describe el material próximo a adquirir, añadiendo el costo final (orden de compra).",
      ficha_entrega:
        "La empresa generará una ficha en la que informa qué productos entregó al cliente, el domicilio, la fecha de entrega, a quién fue entregado y los datos generales del cliente.",
    },
  },
  {
    id: "perivolakia",
    rfc: "TPE2502261CA",
    nombre: "Textiles Perivolakia, S.A. de C.V.",
    domicilio: "Calle Fray Servando Teresa de Mier, exterior 1490, Col. El Mirador, C.P. 44370, Guadalajara, Jalisco",
    regimen: "601",
    cp: "44370",
    rubro: "Manufactura e industria",
    tipo: "insumos",
    proveedores: [
      "Industrias Letkonto, S.A. de C.V.",
      "María Bonita Accesorios, S.A. de C.V.",
      "Comercio Global Ediguan, S.A. de C.V.",
    ],
    entregables: {
      solicitud_insumos:
        "El cliente (Textiles Perivolakia, S.A. de C.V.) interactúa con las siguientes empresas: Industrias Letkonto S.A. de C.V., María Bonita Accesorios S.A. de C.V. y Comercio Global Ediguan S.A. de C.V., de quienes solicita de manera escrita el suministro de insumos textiles.",
      cotizacion:
        "Las empresas con las que interactúa el cliente aceptan la solicitud y realizan un desglose detallado de los materiales que les fueron solicitados, así como de los costos y cantidades.",
      aceptacion_insumos:
        "El cliente acepta la cotización realizada por alguna de las empresas y genera una bitácora en la que describe el material próximo a adquirir, añadiendo el costo final (orden de compra).",
      ficha_entrega:
        "La empresa generará una ficha en la que informa qué productos entregó al cliente, el domicilio, la fecha de entrega, a quién fue entregado y los datos generales del cliente.",
    },
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/** Busca un fronting por su RFC */
export function findFrontingByRfc(rfc) {
  return FRONTINGS.find((f) => f.rfc === rfc) || null;
}

/** Busca un fronting por su id */
export function findFrontingById(id) {
  return FRONTINGS.find((f) => f.id === id) || null;
}

/** Busca un emisor conocido por nombre (parcial, case-insensitive) */
export function findEmisorByNombre(nombre) {
  const q = nombre.toLowerCase();
  return EMISORES_CONOCIDOS.find((e) => e.nombre.toLowerCase().includes(q)) || null;
}

/** Retorna la lista de emisores que son proveedores del fronting dado */
export function getEmisorOptions(fronting) {
  if (!fronting) return EMISORES_CONOCIDOS;
  return fronting.proveedores
    .map((nombre) => {
      const match = EMISORES_CONOCIDOS.find(
        (e) => e.nombre.toLowerCase() === nombre.toLowerCase()
      );
      return match || { nombre, rfc: "", domicilio: "", regimen: "601", cp: "" };
    });
}
