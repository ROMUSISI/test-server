const express = require ('express');
const cors = require ('cors')
const port = 8000;
const app = express();

app.use(cors());
app.get('/home', (req, res) => {
  res.status(200).json({
    make: 'Toyota',
    design: 'Station Wagon',
    tradeName: 'Wish'
  })
} )
app.listen(port, () => console.log(`Server is listening on port: ${port}`));


module.exports = app;