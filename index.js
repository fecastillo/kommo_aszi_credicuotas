const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const app = express();
const port = 3000 || process.env.PORT;
dotenv.config();
const username = process.env.USER_CREDICUOTAS;
const password = process.env.PASS_CREDICUOTAS;
const host = process.env.HOST_CREDICUOTAS;
const verificationId = process.env.VERIFICATION_ID_CREDICUOTAS;
const verificationCode = process.env.VERIFICATION_CODE_CREDICUOTAS;
const auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
var requests = [];

async function getMaxAvailable(dni,telefono) {
    const url = `${host}/${dni}/max?&verificationId=${verificationId}&verificationCode=${verificationCode}&customerCellPhone=${telefono}`;
    //console.log(url);
    const options = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
        }
    };
    try {
        const response = await axios.get(url, options);
        const dataResponse = response.data;
        const {maxAmount,rejectedReason,codRejectedReason} = dataResponse;
        var responseScore = {};
        //chequear si el prospecto esta aprobado
        if(maxAmount != null){
            console.log(`Aprueba por ${maxAmount}`);
            responseScore.importe = maxAmount;
            responseScore.error = null;
            console.log(responseScore);
            return responseScore;
        }
        else{
            console.log(`No aprueba por ${rejectedReason} - ${codRejectedReason}`);
            responseScore.importe = 0.00;
            responseScore.error = codRejectedReason=='CELL_NUMBER_NOT_AVAILABLE'?'Este número de celular está asociado a un cliente existente de Credicuotas.':codRejectedReason;
            console.log(responseScore);
            return responseScore;
        }
        //console.log(response.data);
    } catch (error) {
        console.log("Es un error")
        //imprimir codigo de error
        const errorCode = error.response.data.errorCode;
        console.log(errorCode);
        var responseScore = {};
        if(errorCode == 'CELL_NUMBER_NOT_AVAILABLE'){
            responseScore.importe = 0.00;
            responseScore.error = "Este número de celular está asociado a un cliente existente de Credicuotas.";
            console.log(responseScore);
            return responseScore;
        }
        else{
            responseScore.importe = 0.00;
            responseScore.error = '';
            console.log(responseScore);
            return responseScore;
        }
    }
}

//endpoint para obtener el monto maximo disponible, solo con dni y telefono. Se envia el dni y telefono por query params. Se enviara un token de verificacion para poder ejecutar el endpoint

app.post('/evaluarCredito', async (req, res) => {
    const dni = req.query.dni;
    const telefono = req.query.telefono;
    const token = req.query.token;
    const tokenVerificacion = process.env.TOKEN_VERIFICACION;
    if(token == tokenVerificacion){
        //fecha en formato dd/mm/yyyy hh:mm:ss
        const fecha = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
        requests.push({fecha:fecha,dni:dni,telefono:telefono})
        const response = await getMaxAvailable(dni,telefono);
        res.send(response);
    }
    else{
        res.send("No autorizado");
    }
});
//endpoint para devolver todo en blanco si es get
app.get('/evalaurCredito', (req, res) => {
    res.sendStatus(403);
});

//endpoitn para obtner requests
app.get('/requests', (req, res) => {
    const token = req.query.token;
    const tokenVerificacion = process.env.TOKEN_VERIFICACION;
    if(token == tokenVerificacion){
        res.send(requests);
    }
    else{
        res.send("No autorizado");
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});




//getMaxAvailable(36245678,1164776347);