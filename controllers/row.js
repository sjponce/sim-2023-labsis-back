//File: controllers/rows.js
var mongoose = require('mongoose');
var Row = mongoose.model('row');

//GET - Return all rows in the DB
exports.findAll = async function(req, res) {
	const { limit, skip } = req.query;
    const rows = await Row.find().limit(limit).skip(skip);
    res.status(200).send(rows);
};

//GET - Return all rows in the DB
exports.generate = async function(req, res) {
    await Row.deleteMany({});
	const { n, cotaInfLlegada, cotaSupLlegada, probA, probB, probC, probD, probE, tiempoTrabajoA, tiempoTrabajoB, tiempoTrabajoC, tiempoTrabajoD, tiempoTrabajoE } = req.query;
    const calcUniforme = (a, b) => {
        const rnd = Math.random(); 
        const value = a + rnd * (b - a)
        return [ rnd, value ];
    };

    const calcTipoTrabajo = () => {
        const rndTipoTrabajo = Math.random();
        const [ rndVariacion, variacionTiempoTrabajo] = calcUniforme(-5, 5);
        if (rndTipoTrabajo <= probA) {
            return [ 'A', rndTipoTrabajo, rndVariacion, variacionTiempoTrabajo, tiempoTrabajoA + variacionTiempoTrabajo ];
        }
        if (rndTipoTrabajo <= probB + probA) {
            return [ 'B', rndTipoTrabajo, rndVariacion, variacionTiempoTrabajo, tiempoTrabajoB + variacionTiempoTrabajo ];
        }
        if (rndTipoTrabajo <= probC + probB + probA) {
            return [ 'C', rndTipoTrabajo, rndVariacion, variacionTiempoTrabajo, tiempoTrabajoC + variacionTiempoTrabajo ];
        }
        if (rndTipoTrabajo <= probD + probC + probB + probA) {
            return [ 'D', rndTipoTrabajo, rndVariacion, variacionTiempoTrabajo, tiempoTrabajoD + variacionTiempoTrabajo ];
        }
        else {
            return [ 'E', rndTipoTrabajo, rndVariacion, variacionTiempoTrabajo, tiempoTrabajoE + variacionTiempoTrabajo ];
        }
    };

    const [ rndProxLlegada, proxLlegada ] = calcUniforme(cotaInfLlegada, cotaSupLlegada);

    const filaInicial = {
        reloj: 0,
		evento: 'Init',
		rndProxLlegada,
		proxLlegada,
		rndTipoTrabajo: '',
		tipoTrabajo: '',
		rndTiempoTrabajo: '',
		tiempoTrabajo: '',
		colaLlegada: [],
		tecnico1Estado: 'Disponible',
		tecnico2Estado: 'Disponible',
		objetos: [],
    }

    let filaActual = filaInicial;
    await Row.insertMany([filaActual]);
    
    const eventos = [{ tipo: 'llegada', reloj: proxLlegada }];
    const cola1 = [];
    const cola2 = [];
    let filaAnterior = filaInicial;

    for (let i = 0; i < n; i++) {

        // Obtenemos el proximo evento.
        eventos.sort((a, b) => a.reloj - b.reloj);
        eventoActual = eventos.shift();

        filaActual = {
            reloj: eventoActual.reloj + filaAnterior.reloj,
            evento: eventoActual.tipo, 
        };

        // Segun el evento operamos la fila
        switch (eventoActual.tipo) {
            case 'llegada':
                let [ rndProxLlegada, proxLlegada ] = calcUniforme(30,90);
                proxLlegada += filaAnterior.reloj;
                eventos.push({tipo: 'llegada', reloj: proxLlegada});
                
                const [ tipoTrabajo, rndTipoTrabajo, rndVariacion, variacionTiempoTrabajo, tiempoTrabajo ] = calcTipoTrabajo()
                filaActual = { ...filaActual, rndProxLlegada, proxLlegada, tipoTrabajo, rndTipoTrabajo, rndVariacion, variacionTiempoTrabajo, tiempoTrabajo };

                break;
        
            default:
                break;
        }

        await Row.insertMany([filaActual])
        filaAnterior = filaActual;
    }
    res.status(200).send(true);
};


