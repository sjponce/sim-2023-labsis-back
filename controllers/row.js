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
    n,
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
  } = params;

  const calcUniforme = (a, b) => {
    const rnd = Math.random();
    const value = a + rnd * (b - a);
    return [rnd, value];
  };

  const calcTipoTrabajo = () => {
    const rndTipoTrabajo = Math.random();
    const [rndVariacion, variacionTiempoTrabajo] = calcUniforme(cotaInfVariacionTrabajo, cotaSupVariacionTrabajo);
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

  const filaInicial = {
    n: 0,
    reloj: 0,
    evento: "Init",
    rndProxLlegada,
    proxLlegada,
    rndTipoTrabajo: "",
    tipoTrabajo: "",
    tiempoTrabajo: "",
    colaLlegada: [],
    tecnico1: {
      id: 1,
      estado: "Disponible",
      inicioTrabajo: 0,
      tiempoTrabajo: 0,
      finTrabajo: 0,
    },
    tecnico2: {
      id: 2,
      estado: "Disponible",
      inicioTrabajo: 0,
      tiempoTrabajo: 0,
      finTrabajo: 0,
    },
    trabajos: [],
  };

  let filaActual = filaInicial;
  await Row.insertMany([filaActual]);

  const eventos = [{ tipo: "Llegada", reloj: proxLlegada }];

  let filaAnterior = filaInicial;

  for (let i = 0; i < n; i++) {
    // Obtenemos el proximo evento.
    eventos.sort((a, b) => a.reloj - b.reloj);
    eventoActual = eventos.shift();

    filaActual = {
      ...filaAnterior,
      n: i + 1,
      reloj: eventoActual.reloj + filaAnterior.reloj,
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
        let [rndProxLlegada, proxLlegada] = calcUniforme(
          cotaInfLlegada,
          cotaInfLlegada
        );
        proxLlegada += filaAnterior.reloj;
        eventos.push({ tipo: "Llegada", reloj: proxLlegada });

        filaActual = {
          ...filaActual,
          rndProxLlegada,
          proxLlegada,
        };

        // Caso no hay cupo.
        if (
          tecnico1.estado === "Ocupado" &&
          tecnico2.estado === "Ocupado" &&
          colaLlegada.length >= 3
        ) {
          filaActual.tipoTrabajo = "No hay cupo.";
          filaActual = {
            ...filaActual,
            tipoTrabajo: "Derivado a otro laboratorio",
            rndTipoTrabajo: null,
            rndVariacion: null,
            variacionTiempoTrabajo: null,
            tiempoTrabajo: null,
          };
        } else {
          const [
            tipoTrabajo,
            rndTipoTrabajo,
            rndVariacion,
            variacionTiempoTrabajo,
            tiempoTrabajo,
          ] = calcTipoTrabajo();
          trabajo = {
            ...trabajo,
            tipoTrabajo,
            inicioTrabajo: filaActual.reloj,
            finTrabajo: filaActual.reloj + tiempoTrabajo,
            estado: "Esperando",
          };

          if (tecnico1.estado === "Disponible") {
            tecnico1.estado = "Ocupado";
            tecnico1.tipoTrabajo = tipoTrabajo;
            tecnico1.inicioTrabajo = filaActual.reloj;
            tecnico1.tiempoTrabajo = tiempoTrabajo;
            tecnico1.finTrabajo = tiempoTrabajo + filaActual.reloj;

            trabajo.inicioTrabajo = filaActual.reloj;
            trabajo.finTrabajo = filaActual.reloj + tiempoTrabajo;
            trabajo.estado = "En curso";
          } else if (tecnico2.estado === "Disponible") {
            tecnico2.estado = "Ocupado";
            tecnico2.tipoTrabajo = tipoTrabajo;
            tecnico2.inicioTrabajo = filaActual.reloj;
            tecnico2.tiempoTrabajo = tiempoTrabajo;
            tecnico2.finTrabajo = tiempoTrabajo + filaActual.reloj;

            trabajo.inicioTrabajo = filaActual.reloj;
            trabajo.finTrabajo = filaActual.reloj + tiempoTrabajo;
            trabajo.estado = "En curso";
          } else {
            colaLlegada.push({ tipoTrabajo, tiempoTrabajo });
          }
          eventos.push({
            tipo: "Fin trabajo",
            reloj: variacionTiempoTrabajo + tiempoTrabajo + filaActual.reloj,
            trabajo,
            tecnico:
              tecnico1.inicioTrabajo === filaActual.reloj ? tecnico1 : tecnico2,
          });

          trabajos.push(trabajo);
          filaActual = {
            ...filaActual,
            rndProxLlegada,
            proxLlegada,
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

        trabajos.splice(trabajos.indexOf(t => eventoActual.trabajo === t), 1);
        const tecnico = eventoActual.tecnico.id === 1 ?
            tecnico1 : tecnico2;

        if(colaLlegada.length) {
            colaLlegada.shift();

            tecnico.estado = "Ocupado";
            tecnico.tipoTrabajo = eventoActual.trabajo.tipoTrabajo;
            tecnico.inicioTrabajo = filaActual.reloj;
            tecnico.tiempoTrabajo = eventoActual.trabajo.tiempoTrabajo;
            tecnico.finTrabajo = eventoActual.trabajo.tiempoTrabajo + filaActual.reloj;
        } else {
            tecnico = {
                id: eventoActual.tecnico.id,
                estado: "Disponible",
                inicioTrabajo: 0,
                tiempoTrabajo: 0,
                finTrabajo: 0,
            };
        }

        filaActual = {
            ...filaActual,
            trabajos
        } 
        break;
      default:
        console.log("manejame gato", eventoActual.tipo);
        break;
    }

    await Row.insertMany([filaActual]);
    filaAnterior = filaActual;
  }
  res.status(200).send(true);
};
