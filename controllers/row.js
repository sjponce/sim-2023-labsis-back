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
    finAtencionEmpleadaGratuitaInicial,
    finAtencionEmpleadaPagaInicial,
    proximaLlegadaInicial,
    duracionAuxiliarGratuita,
    largoColaAuxiliar,
    reduccionTiempoAuxiliar,
  } = params;

  const calcExponencialNegativa = (a) => {
    const rnd = Math.random();
    const value = ((-1 / (a / 60)) * Math.log(1 - rnd));
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
  let empleadaPagaInicial = { id: 'EP', estado: 'Disponible', tiempoOcioso: 0, lastUpdate: 0 };
  let empleadaGratuitaInicial = { id: 'EG', estado: 'Disponible', tiempoOcioso: 0, lastUpdate: 0 };
  let personas = {};
  let colaGratuita = [];
  let colaPaga = [];

  const eventos = [
    { tipo: "Llegada", reloj: proximaLlegadaInicial },
  ];

  if (finAtencionEmpleadaGratuitaInicial) {
    let personaAtendidaInicial = {
      id: personasIndex++,
      tipoCola: 'Gratuita',
      llegada: 0,
      inicioAtencion: 0,
      estado: "Siendo Atendida",
      finAtencion: finAtencionEmpleadaGratuitaInicial,
    };
    personas[`T${personaAtendidaInicial.id}`] = {
      ...personas[`T${personaAtendidaInicial.id}`],
      ...personaAtendidaInicial,
    };
    empleadaGratuitaInicial = { 
      ...empleadaGratuitaInicial,
      estado: 'Ocupada',
      inicioAtencion: 0,
      tiempoAtencion: finAtencionEmpleadaGratuitaInicial,
      finAtencion: finAtencionEmpleadaGratuitaInicial,
      persona: personaAtendidaInicial,
    }
    eventos.push({
      tipo: "Fin atencion",
      reloj: finAtencionEmpleadaGratuitaInicial,
      persona: personaAtendidaInicial,
      empleada: empleadaGratuitaInicial,
      cola: colaGratuita
    });
  }

  if (finAtencionEmpleadaPagaInicial) {
    let personaAtendidaInicial = {
      id: personasIndex++,
      tipoCola: 'Paga',
      llegada: 0,
      estado: "Siendo Atendida",
      inicioAtencion: 0,
      finAtencion: finAtencionEmpleadaPagaInicial,
    };
    
    personas[`T${personaAtendidaInicial.id}`] = {
      ...personas[`T${personaAtendidaInicial.id}`],
      ...personaAtendidaInicial,
    };
    empleadaPagaInicial = { 
      ...empleadaPagaInicial,
      estado: 'Ocupada',
      inicioAtencion: 0,
      tiempoAtencion: finAtencionEmpleadaPagaInicial,
      finAtencion: finAtencionEmpleadaPagaInicial,
      persona: personaAtendidaInicial,
    }
    eventos.push({
      tipo: "Fin atencion",
      reloj: finAtencionEmpleadaPagaInicial,
      persona: personaAtendidaInicial,
      empleada: empleadaPagaInicial,
      cola: colaPaga
    });
  }

  if (colaPagaInicial) {
    for (let i = 0; i < colaPagaInicial; i++) {
      const personaInicial = {
        id: personasIndex++,
        tipoCola: 'Paga',
        llegada: 0,
        estado: "Esperando",
      };
      personas[`T${personaInicial.id}`] = {
        ...personas[`T${personaInicial.id}`],
        ...personaInicial,
      };
      colaPaga.push(personaInicial)
    }
  }

  if (colaGratuitaInicial) {
    for (let i = 0; i < colaGratuitaInicial; i++) {
      const personaInicial = {
        id: personasIndex++,
        tipoCola: 'Gratuita',
        llegada: 0,
        estado: "Esperando",
      };
      personas[`T${personaInicial.id}`] = {
        ...personas[`T${personaInicial.id}`],
        ...personaInicial,
      };
      colaGratuita.push(personaInicial);
    }
  }

  const tiempoDemoraVentaAuxiliar = tiempoDemoraVenta * (1 - reduccionTiempoAuxiliar);
  const filaInicial = {
    n: 0,
    reloj: 0,
    evento: "Init",
    rndProxLlegada: undefined,
    tiempoEntreLlegadas: proximaLlegadaInicial,
    proxLlegada: proximaLlegadaInicial,
    rndTipoCola: "",
    tipoCola: "",
    tiempoAtencion: "",
    empleadaPaga: empleadaPagaInicial, 
    colaPaga,
    empleadaGratuita: empleadaGratuitaInicial, 
    colaGratuita,
    personas,
    contadorTiempoOciosoPaga: 0,
  };

  let filaActual = filaInicial;
  await Row.insertMany([filaActual]);

  let filaAnterior = filaInicial;
  while (eventos.find(e => e.reloj <= tiempoFinSimulacion)) {
    n++;
    const empleadaGratuita = filaAnterior.empleadaGratuita;
    const empleadaPaga = filaAnterior.empleadaPaga;
    colaGratuita = filaAnterior.colaGratuita;
    colaPaga = filaAnterior.colaPaga;
    personas = filaAnterior.personas;

    // Agregamos evento auxiliar si la cola es mayor que el limite
    if(empleadaGratuita.estado !== 'Disponible' && colaGratuita.length >= largoColaAuxiliar && !eventos.find(e => e.tipo === 'Inicio auxiliar') && !empleadaGratuita.auxiliar) {
      empleadaGratuita.auxiliar = true;

      eventos.push({
        tipo: "Inicio auxiliar",
        reloj: filaActual.reloj + 0.00001,
        empleada: empleadaGratuita,
        cola: colaGratuita,
      });
    }

    // Obtenemos el proximo evento.
    eventos.sort((a, b) => a.reloj - b.reloj);
    eventoActual = eventos.shift();
    console.log((n, eventoActual.reloj));

    filaActual = {
      ...filaAnterior,
      n,
      reloj: eventoActual.reloj,
      evento: eventoActual.tipo,
      rndTipoCola1: undefined,
      tipoCola1: undefined,
      rndTipoCola2: undefined,
      tipoCola2: undefined,
      rndTipoCola3: undefined,
      tipoCola3: undefined,
    };
    
    if (empleadaPaga.estado === 'Disponible') {
      empleadaPaga.tiempoOcioso = empleadaPaga.tiempoOcioso + (filaActual.reloj - empleadaPaga.lastUpdate)
    }
    empleadaPaga.lastUpdate = filaActual.reloj;

    let persona = {
      estado: 'Esperando',
    }

    // Segun el evento operamos la fila
    switch (eventoActual.tipo) {
      case "Llegada":
        let [rndProxLlegada, tiempoEntreLlegadas] = calcExponencialNegativa(minutosPorLlegada);
        const proxLlegada = tiempoEntreLlegadas + filaActual.reloj;

        eventos.push({
          tipo: "Llegada",
          reloj: tiempoEntreLlegadas + filaActual.reloj,
        });

        filaActual = {
          ...filaActual,
          rndProxLlegada,
          tiempoEntreLlegadas,
          proxLlegada,
        };
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

          if (empleada.estado !== 'Disponible') {
            // Tecnicos no disponibles
            cola.push({ ...persona });
          } else {
            // Caso Disponible
            empleada.estado = "Ocupada";
            empleada.inicioAtencion = filaActual.reloj;
            empleada.tiempoAtencion = empleada.auxiliar ? tiempoDemoraVentaAuxiliar : tiempoDemoraVenta;
            empleada.finAtencion = empleada.tiempoAtencion + filaActual.reloj;
            empleada.persona = persona;

            persona.inicioAtencion = filaActual.reloj;
            persona.finAtencion = empleada.finAtencion;
            persona.estado = "Siendo atendido";

            reloj = reloj + tiempoDemoraVenta;
            eventos.push({
              tipo: "Fin atencion",
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
            personaActual: persona.id,
            tipoCola,
            rndTipoCola,
            tiempoDemoraVenta,
            colaGratuita,
            colaPaga,
            empleadaGratuita,
            empleadaPaga,
            personas,
          };
        break;

      case "Fin atencion":
        let empleadaActual = eventoActual.empleada.id === 'EG' ? filaActual.empleadaGratuita : filaActual.empleadaPaga;
        let colaActual = eventoActual.cola ;

        if (colaActual.length) {
          let persona = colaActual.shift();
          empleadaActual.estado = "Ocupada";
          empleadaActual.inicioAtencion = filaActual.reloj;
          empleadaActual.tiempoAtencion = empleadaActual.auxiliar ? tiempoDemoraVentaAuxiliar : tiempoDemoraVenta;
          empleadaActual.finAtencion = empleadaActual.tiempoAtencion + filaActual.reloj;
          empleadaActual.persona = persona;

          persona.inicioAtencion = filaActual.reloj;
          persona.finAtencion = empleadaActual.finAtencion;
          persona.estado = "Siendo atendido";
          
          personas[`T${persona.id}`] = {
            ...persona,
          };
          eventos.push({
            tipo: "Fin atencion",
            reloj: empleadaActual.finAtencion,
            persona,
            empleada: empleadaActual,
            cola: colaActual
          });
        } else {
          empleadaActual = {
            ...empleadaActual,
            id: eventoActual.empleada.id,
            estado: "Disponible",
            inicioAtencion: undefined,
            tiempoAtencion: undefined,
            finAtencion: undefined,
          };
        }

        delete personas[`T${eventoActual.persona.id}`];
        filaActual = {
          ...filaActual,
          rndProxLlegada: undefined,
          tiempoEntreLlegadas: undefined,
          tipoCola: undefined,
          rndTipoCola: undefined,
          tiempoAtencion: undefined,
          rndTipoCola1: undefined,
          tipoCola1: undefined,
          rndTipoCola2: undefined,
          tipoCola2: undefined,
          rndTipoCola3: undefined,
          tipoCola3: undefined,
          personas,
          empleadaPaga: empleadaActual.id === 'EP' ? empleadaActual : empleadaPaga,
          empleadaGratuita: empleadaActual.id === 'EG' ? empleadaActual : empleadaGratuita,
          colaPaga,
          colaGratuita,
        };
        break;

      case 'Inicio auxiliar':
        eventos.push({
          tipo: "Fin auxiliar",
          reloj: filaActual.reloj + duracionAuxiliarGratuita,
        });
      break;

      case 'Fin auxiliar':
        filaActual.empleadaGratuita.auxiliar = false;
        filaActual = {
          ...filaActual,
          rndTipoCola1: undefined,
          tipoCola1: undefined,
          rndTipoCola2: undefined,
          tipoCola2: undefined,
          rndTipoCola3: undefined,
          tipoCola3: undefined,
        }
      break;
      default:
        console.log("Evento no manejado", eventoActual.tipo);
        break;
    }

    await Row.insertMany([filaActual]);
    filaAnterior = filaActual;
    tiempoTotal = filaActual.reloj;
  }

  res.status(200).send({ n });
};
