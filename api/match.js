module.exports = async (req, res) => {

  return res.status(200).json({
    encontrados: 1,
    matches: [
      {
        "id público (EB)": "TEST123",
        "título de propiedad": "Casa prueba en Polanco",
        "precio de venta": "10000000",
        "colonia/zona/barrio": "Polanco"
      }
    ]
  });

};
