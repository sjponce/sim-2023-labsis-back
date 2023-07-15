//File: controllers/rows.js
var mongoose = require("mongoose");
var Row = mongoose.model("row");

//GET - Return all rows in the DB
exports.findAll = async function (req, res) {
  const { limit, skip } = req.query;
  const rows = await Row.find().limit(limit).skip(skip);
  res.status(200).send(rows);
};

//GET - Return all rows in the DB
exports.generate = async function (req, res) {
  await Row.deleteMany({});
  const params = req.query;
  Object.keys(params).forEach((k) =>
    !isNaN(params[k]) ? (params[k] = Number(params[k])) : k
  );
  const {
    probPasajeGratuito,
    minutosPorLlegada,
    tiempoDemoraVenta,
    tiempoFinSimulacion,
    colaPagaInicial,
    colaGratuitaInicial,
    empleadaGratuitaInicial,
    empleadaPagaInicial,
    proximaLlegadaInicial,

  } = params;

  const calcExponencialNegativa = (a) => {
    const rnd = Math.random();
    const value = (-1 / a) * Math.log(1 - rnd);
    return [rnd, value];
  };

  const calcTipoCola = () => {
    const rndTipoCola = Math.random();

    if (rndTipoCola <= probPasajeGratuito) {
      return [
        "Gratuita",
        rndTipoCola,
      ];
    } else {
      return [
        "Paga",
        rndTipoCola
      ]
    }
  };

  let n = 0;
  let personasIndex = 0;
  const filaInicial = {
    n: 0,
    reloj: 0,
    evento: "Init",
    rndProxLlegada,
    tiempoEntreLlegadas: proxLlegada,
    proxLlegada,
    rndTipoCola: "",
    tipoCola: "",
    tiempoAtencion: "",
    empleadaPaga: {id: 'EP', ...empleadaPagaInicial}, 
    colaPaga: colaPagaInicial,
    empleadaGratuita: { id: 'EG', ...empleadaPagaInicial }, 
    colaGratuita: colaGratuitaInicial,
    personas: {},
    contadorTiempoOciosoPaga: 0,
  };

  let filaActual = filaInicial;
  await Row.insertMany([filaActual]);

  const eventos = [
    { tipo: "Llegada", reloj: proximaLlegadaInicial },
  ];

  let filaAnterior = filaInicial;
  while (
    cerrado === false ||
    (eventos.filter((e) => e.reloj <= tiempoFinSimulacion))
  ) {
    n++;
    // Obtenemos el proximo evento.
    eventos.sort((a, b) => a.reloj - b.reloj);
    eventoActual = eventos.shift();

    filaActual = {
      ...filaAnterior,
      n,
      reloj: eventoActual.reloj,
      evento: eventoActual.tipo,
    };

    const empleadaGratuita = filaAnterior.empleadaGratuita;
    const empleadaPaga = filaAnterior.empleadaPaga;
    const colaGratuita = filaAnterior.colaLlegada;
    const colaPaga = filaAnterior.colaLlegada;
    const personas = filaAnterior.personas;
    let persona = {
      estado: 'Esperando',
    }
    // Segun el evento operamos la fila
    switch (eventoActual.tipo) {
      case "Llegada":
        let [rndProxLlegada, tiempoEntreLlegadas] = calcExponencialNegativa(minutosPorLlegada);
        const proxLlegada = tiempoEntreLlegadas + filaActual.reloj;

        filaActual = {
          ...filaActual,
          rndProxLlegada,
          tiempoEntreLlegadas,
          proxLlegada,
        }; {

        const [
          tipoCola,
          rndTipoCola
        ] = calcTipoCola();
        persona = {
          ...persona,
          id: personasIndex++,
          tipoCola,
          llegada: filaActual.reloj,
          estado: "Esperando",
        };
        let reloj = filaActual.reloj;
        let empleada = tipoCola === 'Gratuita' ?
          empleadaGratuita :
          empleadaPaga;
        
        let cola = tipoCola === 'Gratuita' ?
          colaGratuita :
          colaPaga;

        const 
        if (empleada.estado !== 'Disponible') {
          // Tecnicos no disponibles
          cola.push({ ...persona });
        } else {
            // Caso Disponible
            empleada.estado = "Ocupada";
            empleada.inicioAtencion = filaActual.reloj;
            empleada.tiempoAtencion = tiempoDemoraVenta;
            empleada.finAtencion = tiempoDemoraVenta + filaActual.reloj;

            persona.inicioAtencion = filaActual.reloj;
            persona.finAtencion = filaActual.reloj + tiempoDemoraVenta;
            persona.estado = "Siendo atendido";

            reloj = reloj + tiempoDemoraVenta;
            eventos.push({
              tipo: "Fin Atencion",
              reloj,
              persona,
              empleada,
              cola,
            });
          }

          personas[`T${persona.id}`] = {
            ...personas[`T${persona.id}`],
            ...persona,
          };

          filaActual = {
            ...filaActual,
            personaActual: trabajo.id,
            tipoCola,
            rndTipoCola,
            tiempoDemoraVenta,
            colaGratuita,
            colaPaga,
            empleadaGratuita,
            empleadaPaga,
            personas,
          };
        }
        break;

      case "Fin trabajo":
        let empleada = eventoActual.empleada;
        let cola = eventoActual.cola;

        if (cola.length) {
          let persona = cola.shift();
          empleada.estado = "Ocupada";
          empleada.inicioAtencion = filaActual.reloj;
          empleada.tiempoAtencion = tiempoDemoraVenta;
          empleada.finAtencion = tiempoDemoraVenta + filaActual.reloj;

          persona.inicioAtencion = filaActual.reloj;
          persona.finAtencion = filaActual.reloj + tiempoDemoraVenta;
          persona.estado = "Siendo atendido";
          
          personas[`T${trabajo.id}`] = {
            ...persona,
          };
          eventos.push({
            tipo: "Fin trabajo",
            reloj: empleada.finAtencion,
            trabajo,
            tecnico,
          });
        } else {
          empleada = {
            id: eventoActual.empleada.id,
            estado: "Disponible",
            inicioAtencion: undefined,
            tiempoAtencion: undefined,
            finAtencion: undefined,
          };
        }

        filaActual = {
          ...filaActual,
          rndProxLlegada: undefined,
          tiempoEntreLlegadas: undefined,
          tipoCola: undefined,
          rndTipoCola: undefined,
          tiempoAtencion: undefined,
          personas,
          empleadaPaga: empleada.id === 'EP' ? empleada : empleadaPaga,
          empleadaGratuita: empleada.id === 'EG' ? empleada : empleadaGratuita,
          colaPaga,
          colaGratuita
        };
        break;

      default:
        console.log("Evento no manejado", eventoActual.tipo);
        break;
    }

    filaActual = {
      ...filaActual,
    };

    await Row.insertMany([filaActual]);
    filaAnterior = filaActual;
    tiempoTotal = filaActual.reloj;
  }

  res.status(200).send({ n });
};
