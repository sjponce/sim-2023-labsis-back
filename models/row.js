exports = module.exports = function(app, mongoose) {

	var rowSchema = new mongoose.Schema({
		reloj: 		{ type: Number },
		evento: 		{ type: String },
		rndProxLlegada: { type: Number },
		proxLlegada: { type: Number },
		rndTipoTrabajo: { type: Number },
		tipoTrabajo: { type: String },
		rndTiempoTrabajo: { type: Number },
		tiempoTrabajo: { type: Number },
		colaLlegada: { type: [] },
		tecnico1Estado: { type: String },
		tecnico2Estado: { type: String },
		objetos: { type: [] },
	});
	mongoose.model('row', rowSchema);
};