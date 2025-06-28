const dashboardService = require ('../services/dashboardService');

const getDashInfo = async (req, res) => {
  console.log('Details of the logged on user', req.user)
  const {userId, role, unitId} = req.user;
  try {
    const response =await dashboardService.getDashInfo(userId, role, unitId)

    console.log ('dashboard controller response: ', response)

    if (response && response.status === 'OK') {
      return res.status(200).json ({
        dashData: response.dashData
      })
    } else if (response && response.status === 'Error') {
      return res.status(500).json ({
        dashData: response.dashData
      })
    }
  } catch (error) {
    console.log ('internal server error', error)
    return res.status(500).json ({
      dashData: {}
    })
  }
}

module.exports = {
  getDashInfo
}