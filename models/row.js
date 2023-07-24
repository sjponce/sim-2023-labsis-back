exports = module.exports = function(app, mongoose) {

	var rowSchema = new mongoose.Schema({
		n: {type: Number},
		reloj: 		{ type: Number },
		evento: 		{ type: String },
		rndProxLlegada: { type: Number },
		proxLlegada: { type: Number },
		tiempoEntreLlegadas: { type: Number },
		rndTipoCola: { type: Number },
		tipoCola: { type: String },
		empleadaGratuita: { type: { } },
		auxiliarGratuita: { type: { } },
		colaGratuita: { type: [] },
		empleadaPaga: { type: { } },
		colaPaga: { type: [] },
		contadorTiempoOciosoPaga: { type: Number },
		personas: { type:{} },
	});
	mongoose.model('row', rowSchema);
};
                