import { configureSdk } from '@acadian/sdk'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import App from './App'
import { store } from './app/store'
import { API_BASE_URL } from './config'
import './index.css'

// Point the generated SDK at the configured API before anything renders.
configureSdk({ baseUrl: API_BASE_URL })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
