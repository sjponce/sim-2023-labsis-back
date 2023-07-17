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
  console.log('delete');
  await Row.deleteMany({});
  console.log('deletent');
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
    finTrabajoEmpleadaGratuitaInicial,
    finTrabajoEmpleadaPagaInicial,
    proximaLlegadaInicial,
    duracionAuxiliarGratuita,
    largoColaAuxiliar,
    reduccionTiempoAuxiliar,
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
  let empleadaPagaInicial = { id: 'EP', estado: 'Disponible' };
  let empleadaGratuitaInicial = { id: 'EG', estado: 'Disponible' };
  let colaGratuita = [];
  let colaPaga = [];
  let personasPorLlegada = 3;

  if (finTrabajoEmpleadaGratuitaInicial) {
    let personaAtendidaInicial = {
      id: personasIndex++,
      tipoCola: 'Gratuita',
      llegada: filaActual.reloj,
      estado: "Siendo Atendida",
      finAtencion: finTrabajoEmpleadaGratuitaInicial,
    };
    
    personas.push(personaAtendidaInicial)
    empleadaGratuitaInicial = { 
      ...empleadaGratuitaInicial,
      estado: 'Ocupada',
      finTrabajo: finTrabajoEmpleadaGratuitaInicial,
      persona: personaAtendidaInicial,
    }
  }

  if (finTrabajoEmpleadaPagaInicial) {
    let personaAtendidaInicial = {
      id: personasIndex++,
      tipoCola: 'Paga',
      llegada: filaActual.reloj,
      estado: "Siendo Atendida",
      finAtencion: finTrabajoEmpleadaPagaInicial,
    };
    
    personas.push(personaAtendidaInicial)
    empleadaGratuitaInicial = { 
      ...empleadaGratuitaInicial,
      estado: 'Ocupada',
      finTrabajo: finTrabajoEmpleadaPagaInicial,
      persona: personaAtendidaInicial,
    }
  }

  if (colaPagaInicial) {
    for (let i = 0; i <= colaPagaInicial; i++) {
      const personaInicial = {
        id: personasIndex++,
        tipoCola: 'Paga',
        llegada: filaActual.reloj,
        estado: "Esperando",
      };
      personas.push(personaInicial)
      colaPaga.push(personaInicial)
    }
  }

  if (colaGratuitaInicial) {
    for (let i = 0; i <= colaGratuitaInicial; i++) {
      persona = {
        ...persona,
        id: personasIndex++,
        tipoCola: 'Gratuita',
        llegada: filaActual.reloj,
        estado: "Esperando",
      };
      personas.push(personaInicial);
      colaGratuita.push(personaInicial);
    }
  }

  const tiempoDemoraVentaAuxiliar = tiempoDemoraVenta * (1 - reduccionTiempoAuxiliar);
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
    empleadaPaga: empleadaPagaInicial, 
    colaPaga,
    empleadaGratuita: empleadaGratuitaInicial, 
    colaGratuita,
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
      rndTipoCola1: undefined,
      tipoCola1: undefined,
      rndTipoCola2: undefined,
      tipoCola2: undefined,
      rndTipoCola3: undefined,
      tipoCola3: undefined,
    };

    const empleadaGratuita = filaAnterior.empleadaGratuita;
    const empleadaPaga = filaAnterior.empleadaPaga;
    const colaGratuita = filaAnterior.colaLlegada;
    const colaPaga = filaAnterior.colaLlegada;
    const personas = filaAnterior.personas;
    
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

        filaActual = {
          ...filaActual,
          rndProxLlegada,
          tiempoEntreLlegadas,
          proxLlegada,
        };
        let tiposCola = [];
        for (let i = 0; i <= personasPorLlegada; i++) {
          const [
            tipoCola,
            rndTipoCola
          ] = calcTipoCola();

          tiposCola.push([tipoCola,rndTipoCola])
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
            if(empleada.id === 'EG' && cola.length >= largoColaAuxiliar) {
              empleada.auxiliar = true;

              eventos.push({
                tipo: "Inicio auxiliar",
                reloj: empleada.finAtencion,
                persona,
                empleada,
                cola,
              });
            }
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
        filaActual = {
          ...filaActual,
          rndTipoCola1: tiposCola[0][0],
          tipoCola1: tiposCola[0][1],
          rndTipoCola2: tiposCola[1][0],
          tipoCola2: tiposCola[1][1],
          rndTipoCola3: tiposCola[2][0],
          tipoCola3: tiposCola[2][1],
        };
        break;

      case "Fin trabajo":
        let empleada = eventoActual.empleada;
        let cola = eventoActual.cola;

        if (cola.length) {
          let persona = cola.shift();
          empleada.estado = "Ocupada";
          empleada.inicioAtencion = filaActual.reloj;
          empleada.tiempoAtencion = empleada.auxiliar ? tiempoDemoraVentaAuxiliar : tiempoDemoraVenta;
          empleada.finAtencion = empleada.tiempoAtencion + filaActual.reloj;
          empleada.persona = persona;

          persona.inicioAtencion = filaActual.reloj;
          persona.finAtencion = empleada.finAtencion;
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
          rndTipoCola1: undefined,
          tipoCola1: undefined,
          rndTipoCola2: undefined,
          tipoCola2: undefined,
          rndTipoCola3: undefined,
          tipoCola3: undefined,
          personas,
          empleadaPaga: empleada.id === 'EP' ? empleada : empleadaPaga,
          empleadaGratuita: empleada.id === 'EG' ? empleada : empleadaGratuita,
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
