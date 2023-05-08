exports = module.exports = function(app, mongoose) {

	var rowSchema = new mongoose.Schema({
		n: {type: Number},
		reloj: 		{ type: Number },
		evento: 		{ type: String },
		rndProxLlegada: { type: Number },
		tiempoEntreLlegadas: { type: Number },
		promedioPermanenciaEquipos: { type: Number },
		porcentajeEquiposDerivados: { type: Number },
		porcentajeDesocupacionT1: { type: Number },
		porcentajeDesocupacionT2: { type: Number },
		proxLlegada: { type: Number },
		rndTipoTrabajo: { type: Number },
		tipoTrabajo: { type: String },
		rndTiempoTrabajo: { type: Number },
		rndVariacion: { type: Number },
		variacionTiempoTrabajo: { type: Number },
		tiempoTrabajo: { type: Number },
		colaLlegada: { type: [] },
		tecnico1: { type: {} },
		tecnico2: { type: {} },
		trabajos: { type: {} },
	});
	mongoose.model('row', rowSchema);
};
                