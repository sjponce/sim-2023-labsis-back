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
    tiempoCierre,
    cotaInfLlegada,
    cotaSupLlegada,
    probA,
    probB,
    probC,
    probD,
    probE,
    tiempoTrabajoA,
    tiempoTrabajoB,
    tiempoTrabajoC,
    tiempoTrabajoD,
    tiempoTrabajoE,
    cotaInfVariacionTrabajo,
    cotaSupVariacionTrabajo,
    tiempoTrabajoInicialC,
    tiempoTrabajoFinalC,
    tamanoCola,
  } = params;

  const calcUniforme = (a, b) => {
    const rnd = Math.random();
    const value = a + rnd * (b - a);
    return [rnd, value];
  };

  const calcTipoTrabajo = () => {
    const rndTipoTrabajo = Math.random();
    const [rndVariacion, variacionTiempoTrabajo] = calcUniforme(
      cotaInfVariacionTrabajo,
      cotaSupVariacionTrabajo
    );
    if (rndTipoTrabajo <= probA) {
      return [
        "A",
        rndTipoTrabajo,
        rndVariacion,
        variacionTiempoTrabajo,
        tiempoTrabajoA + variacionTiempoTrabajo,
      ];
    }
    if (rndTipoTrabajo <= probB + probA) {
      return [
        "B",
        rndTipoTrabajo,
        rndVariacion,
        variacionTiempoTrabajo,
        tiempoTrabajoB + variacionTiempoTrabajo,
      ];
    }
    if (rndTipoTrabajo <= probC + probB + probA) {
      return [
        "C",
        rndTipoTrabajo,
        rndVariacion,
        variacionTiempoTrabajo,
        tiempoTrabajoC + variacionTiempoTrabajo,
      ];
    }
    if (rndTipoTrabajo <= probD + probC + probB + probA) {
      return [
        "D",
        rndTipoTrabajo,
        rndVariacion,
        variacionTiempoTrabajo,
        tiempoTrabajoD + variacionTiempoTrabajo,
      ];
    } else {
      return [
        "E",
        rndTipoTrabajo,
        rndVariacion,
        variacionTiempoTrabajo,
        tiempoTrabajoE + variacionTiempoTrabajo,
      ];
    }
  };

  const [rndProxLlegada, proxLlegada] = calcUniforme(
    cotaInfLlegada,
    cotaSupLlegada
  );

  let trabajosIndex = 0;
  let contadorNoAtendidos = 0;
  let contadorAtendidos = 0;
  let tiempoOcioso1 = [{ inicio: 0, fin: 0 }];
  let tiempoOcioso2 = [{ inicio: 0, fin: 0 }];
  let n = 0;
  let cerrado = false;
  let eliminadosCount = 0;
  let eliminadosCant = 0;
  const filaInicial = {
    n: 0,
    reloj: 0,
    promedioPermanenciaEquipos: null,
    porcentajeEquiposDerivados: 0,
    porcentajeDesocupacionT1: 100,
    porcentajeDesocupacionT2: 100,
    evento: "Init",
    rndProxLlegada,
    tiempoEntreLlegadas: proxLlegada,
    proxLlegada,
    rndTipoTrabajo: "",
    tipoTrabajo: "",
    tiempoTrabajo: "",
    colaLlegada: [],
    tecnico1: {
      id: 1,
      estado: "Disponible",
    },
    tecnico2: {
      id: 2,
      estado: "Disponible",
    },
    trabajos: {},
  };

  let filaActual = filaInicial;
  await Row.insertMany([filaActual]);

  const eventos = [
    { tipo: "Llegada", reloj: proxLlegada },
    { tipo: "Cierre local", reloj: tiempoCierre },
  ];

  let filaAnterior = filaInicial;
  while (
    cerrado === false ||
    (filaAnterior.tecnico1.estado === "Ocupado" &&
      filaAnterior.tecnico2.estado === "Ocupado" &&
      eventos.filter((e) => e.tipotrabajo === "Fin trabajo"))
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

    const tecnico1 = filaAnterior.tecnico1;
    const tecnico2 = filaAnterior.tecnico2;
    const colaLlegada = filaAnterior.colaLlegada;
    const trabajos = filaAnterior.trabajos;
    let trabajo = {
      estado: "Esperando",
    };
    // Segun el evento operamos la fila
    switch (eventoActual.tipo) {
      case "Llegada":
        let [rndProxLlegada, tiempoEntreLlegadas] = calcUniforme(
          cotaInfLlegada,
          cotaSupLlegada
        );
        const proxLlegada = tiempoEntreLlegadas + filaActual.reloj;
        if (proxLlegada <= tiempoCierre) {
          eventos.push({ tipo: "Llegada", reloj: proxLlegada });
        }

        filaActual = {
          ...filaActual,
          rndProxLlegada,
          tiempoEntreLlegadas,
          proxLlegada,
        };

        // Caso no hay cupo.
        if (
          tecnico1.estado === "Ocupado" &&
          tecnico2.estado === "Ocupado" &&
          colaLlegada.length >= tamanoCola
        ) {
          contadorNoAtendidos++;
          let porcentajeEquiposDerivados =
            (contadorNoAtendidos / (contadorAtendidos + contadorNoAtendidos)) *
            100;
          filaActual.tipoTrabajo = "No hay cupo.";
          filaActual = {
            ...filaActual,
            porcentajeEquiposDerivados,
            tipoTrabajo: "Derivado a otro laboratorio",
            rndTipoTrabajo: null,
            rndVariacion: null,
            variacionTiempoTrabajo: null,
            tiempoTrabajo: null,
          };
        } else {
          // Caso con cupo
          contadorAtendidos++;
          const [
            tipoTrabajo,
            rndTipoTrabajo,
            rndVariacion,
            variacionTiempoTrabajo,
            tiempoTrabajo,
          ] = calcTipoTrabajo();
          trabajo = {
            ...trabajo,
            id: trabajosIndex++,
            tipoTrabajo,
            tiempoTrabajo,
            llegada: filaActual.reloj,
            estado: "Esperando",
          };
          let reloj = filaActual.reloj;
          let tecnico =
            tecnico1.estado === "Disponible"
              ? tecnico1
              : tecnico2.estado === "Disponible"
              ? tecnico2
              : undefined;
          if (!tecnico) {
            // Tecnicos no disponibles
            colaLlegada.push({ ...trabajo });
          } else if (trabajo.tipoTrabajo === "C") {
            // Caso C
            tecnico.estado = "Ocupado";
            tecnico.tipoTrabajo = tipoTrabajo;
            tecnico.inicioTrabajo = reloj;
            tecnico.tiempoTrabajo = tiempoTrabajoInicialC;
            tecnico.finTrabajo = tiempoTrabajoInicialC + reloj;

            tecnico.id === 1
              ? (tiempoOcioso1[tiempoOcioso1.length - 1].fin =
                  tecnico.inicioTrabajo)
              : (tiempoOcioso2[tiempoOcioso2.length - 1].fin =
                  tecnico.inicioTrabajo);

            trabajo.estado = "En curso";
            trabajo.tiempoFinTrabajoInicialC = reloj + tiempoTrabajoInicialC;
            trabajo.inicioTrabajo = reloj;
            eventos.push({
              tipo: "Fin trabajo",
              reloj: tecnico.finTrabajo,
              trabajo,
              tecnico,
            });
          } else {
            // Caso A B D E
            tecnico.estado = "Ocupado";
            tecnico.tipoTrabajo = tipoTrabajo;
            tecnico.inicioTrabajo = filaActual.reloj;
            tecnico.tiempoTrabajo = tiempoTrabajo;
            tecnico.finTrabajo = tiempoTrabajo + filaActual.reloj;

            trabajo.inicioTrabajo = filaActual.reloj;
            trabajo.finTrabajo = filaActual.reloj + tiempoTrabajo;
            trabajo.estado = "En curso";

            tecnico.id === 1
              ? (tiempoOcioso1[tiempoOcioso1.length - 1].fin =
                  tecnico.inicioTrabajo)
              : (tiempoOcioso2[tiempoOcioso2.length - 1].fin =
                  tecnico.inicioTrabajo);

            reloj = reloj + tiempoTrabajo;
            eventos.push({
              tipo: "Fin trabajo",
              reloj,
              trabajo,
              tecnico,
            });
          }

          trabajos[`T${trabajo.id}`] = {
            ...trabajos[`T${trabajo.id}`],
            ...trabajo,
          };

          let porcentajeEquiposDerivados =
            (contadorNoAtendidos / (contadorAtendidos + contadorNoAtendidos)) *
            100;
          filaActual = {
            ...filaActual,
            porcentajeEquiposDerivados,
            tipoTrabajo,
            rndTipoTrabajo,
            rndVariacion,
            variacionTiempoTrabajo,
            tiempoTrabajo,
            colaLlegada,
            tecnico1,
            tecnico2,
            trabajos,
          };
        }
        break;

      case "Fin trabajo":
        // Si un trabajo C termina su trabajo solitario, se agrega a la cola
        if (eventoActual.trabajo.estado === "En curso(solitario)") {
          const trabajoC = eventoActual.trabajo;
          trabajoC.estado = "Esperando";

          colaLlegada.push(trabajoC);

          filaActual = {
            ...filaActual,
            trabajos: {
              ...filaActual.trabajos,
              [`T${eventoActual.trabajo.id}`]: {
                ...trabajoC,
              },
            },
            colaLlegada,
          };
          break;
        }

        // Si un trabajo C esta en curso y tiene que empezar su trabajo solitario(fin de trabajo === undefined)
        if (
          eventoActual.trabajo.tipoTrabajo === "C" &&
          eventoActual.trabajo.estado === "En curso" &&
          eventoActual.trabajo.tiempoFinTrabajoSolitarioC === undefined
        ) {
          const trabajoC = eventoActual.trabajo;
          trabajoC.estado = "En curso(solitario)";
          trabajoC.tiempoFinTrabajoSolitarioC =
            eventoActual.reloj -
            tiempoTrabajoInicialC +
            tiempoTrabajoC +
            tiempoTrabajoFinalC;
          eventos.push({
            tipo: "Fin trabajo",
            reloj: trabajoC.tiempoFinTrabajoSolitarioC,
            trabajo: trabajoC,
          });

          trabajos[`T${eventoActual.trabajo.id}`] = {
            ...trabajoC,
          };
        } else {
          // En caso que un C llegue con fecha de fin, se trata como un A B D o E

          // Promedio permanencia
          if (eventoActual.trabajo.finTrabajo > 0) {
            eliminadosCount +=
              eventoActual.trabajo.finTrabajo -
              eventoActual.trabajo.inicioTrabajo;
            eliminadosCant++;
            filaActual = {
              ...filaActual,
              promedioPermanenciaEquipos: eliminadosCount / eliminadosCant,
            };
          }

          delete trabajos[`T${eventoActual.trabajo.id}`];
        }

        let tecnico = eventoActual.tecnico.id === 1 ? tecnico1 : tecnico2;
        let reloj = eventoActual.reloj;
        if (colaLlegada.length) {
          let trabajo = colaLlegada.shift();

          if (
            trabajo.tipoTrabajo === "C" &&
            trabajo.tiempoFinTrabajoSolitarioC === undefined
          ) {
            // Caso C primera vuelta
            tecnico.estado = "Ocupado";
            tecnico.tipoTrabajo = trabajo.tipoTrabajo;
            tecnico.inicioTrabajo = reloj;
            tecnico.tiempoTrabajo = tiempoTrabajoInicialC;
            tecnico.finTrabajo = tecnico.tiempoTrabajo + reloj;

            trabajo.estado = "En curso";
            trabajo.inicioTrabajo = reloj;
            trabajo.tiempoFinTrabajoInicialC = reloj + tiempoTrabajoInicialC;

            tecnico.id === 1
              ? (tiempoOcioso1[tiempoOcioso1.length - 1].fin =
                  tecnico.inicioTrabajo)
              : (tiempoOcioso2[tiempoOcioso2.length - 1].fin =
                  tecnico.inicioTrabajo);
          } else if (
            trabajo.tipoTrabajo === "C" &&
            trabajo.tiempoFinTrabajoSolitarioC !== undefined
          ) {
            // Caso C segunda vuelta
            tecnico.estado = "Ocupado";
            tecnico.tipoTrabajo = trabajo.tipoTrabajo;
            tecnico.inicioTrabajo = reloj;
            tecnico.tiempoTrabajo = tiempoTrabajoFinalC;
            tecnico.finTrabajo = tecnico.tiempoTrabajo + reloj;

            tecnico.id === 1
              ? (tiempoOcioso1[tiempoOcioso1.length - 1].fin =
                  tecnico.inicioTrabajo)
              : (tiempoOcioso2[tiempoOcioso2.length - 1].fin =
                  tecnico.inicioTrabajo);

            trabajo.estado = "En curso";
            trabajo.tiempoInicioTrabajoFinalC = reloj;
            trabajo.finTrabajo = reloj + tiempoTrabajoFinalC;
          } else {
            // Caso A B D E
            tecnico.estado = "Ocupado";
            tecnico.tipoTrabajo = trabajo.tipoTrabajo;
            tecnico.inicioTrabajo = filaActual.reloj;
            tecnico.tiempoTrabajo = trabajo.tiempoTrabajo;
            tecnico.finTrabajo = trabajo.tiempoTrabajo + filaActual.reloj;

            tecnico.id === 1
              ? (tiempoOcioso1[tiempoOcioso1.length - 1].fin =
                  tecnico.inicioTrabajo)
              : (tiempoOcioso2[tiempoOcioso2.length - 1].fin =
                  tecnico.inicioTrabajo);

            trabajo.inicioTrabajo = filaActual.reloj;
            trabajo.finTrabajo = filaActual.reloj + trabajo.tiempoTrabajo;
            trabajo.estado = "En curso";

            reloj = reloj + trabajo.tiempoTrabajo;
          }

          trabajos[`T${trabajo.id}`] = {
            ...trabajo,
          };
          eventos.push({
            tipo: "Fin trabajo",
            reloj: tecnico.finTrabajo,
            trabajo,
            tecnico,
          });
        } else {
          tecnico = {
            id: eventoActual.tecnico.id,
            estado: "Disponible",
            inicioTrabajo: undefined,
            tiempoTrabajo: undefined,
            finTrabajo: undefined,
          };

          tecnico.id === 1
            ? tiempoOcioso1.push({ inicio: eventoActual.reloj })
            : tiempoOcioso2.push({ inicio: eventoActual.reloj });
        }

        filaActual = {
          ...filaActual,
          rndProxLlegada: undefined,
          tiempoEntreLlegadas: undefined,
          proxLlegada: undefined,
          tipoTrabajo: undefined,
          rndTipoTrabajo: undefined,
          rndVariacion: undefined,
          variacionTiempoTrabajo: undefined,
          tiempoTrabajo: undefined,
          trabajos,
          tecnico1: tecnico.id === 1 ? tecnico : tecnico1,
          tecnico2: tecnico.id === 2 ? tecnico : tecnico2,
          colaLlegada,
        };
        break;

      case "Cierre local":
        cerrado = true;
        filaActual = {
          ...filaActual,
          rndProxLlegada: undefined,
          tiempoEntreLlegadas: undefined,
          proxLlegada: undefined,
          tipoTrabajo: undefined,
          rndTipoTrabajo: undefined,
          rndVariacion: undefined,
          variacionTiempoTrabajo: undefined,
          tiempoTrabajo: undefined,
        };
        break;
      default:
        console.log("Evento no manejado", eventoActual.tipo);
        break;
    }

    const tiempoDesocupacionT1 = tiempoOcioso1.reduce((acc, cur) => {
      const fin = cur.fin ? cur.fin : filaActual.reloj;
      return acc + (fin - cur.inicio);
    }, 0);

    const tiempoDesocupacionT2 = tiempoOcioso2.reduce((acc, cur) => {
      const fin = cur.fin ? cur.fin : filaActual.reloj;
      return acc + (fin - cur.inicio);
    }, 0);

    filaActual = {
      ...filaActual,
      porcentajeDesocupacionT1: tiempoDesocupacionT1 / filaActual.reloj * 100,
      porcentajeDesocupacionT2: tiempoDesocupacionT2 / filaActual.reloj * 100,
    };

    await Row.insertMany([filaActual]);
    filaAnterior = filaActual;
    tiempoTotal = filaActual.reloj;
  }

  res.status(200).send({ n });
};
