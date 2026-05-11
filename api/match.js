export default async function handler(req, res) {
  return res.status(200).json({
    encontrados: 1,
    matches: [
      {
        "id público (EB)": "TEST123",
        "título de propiedad": "Casa prueba en Polanco",
        "precio de venta": "10000000",
        "colonia/zona/barrio": "Polanco",
        "recámaras": 3,
        "baños": 2,
        "estacionamientos": 2
      }
    ]
  });
}
