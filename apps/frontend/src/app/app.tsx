import { Link, Route, Routes } from 'react-router-dom'

export function App() {
  return (
    <main>
      <header>
        <h1>Aerealith AI</h1>

        <nav aria-label='Primary navigation'>
          <ul>
            <li>
              <Link to='/'>Home</Link>
            </li>
            <li>
              <Link to='/page-2'>Page 2</Link>
            </li>
          </ul>
        </nav>
      </header>

      <Routes>
        <Route
          path='/'
          element={
            <section>
              <h2>Welcome to Aerealith</h2>
              <p>The application foundation is ready.</p>
              <Link to='/page-2'>Open page 2</Link>
            </section>
          }
        />

        <Route
          path='/page-2'
          element={
            <section>
              <h2>Page 2</h2>
              <Link to='/'>Return home</Link>
            </section>
          }
        />
      </Routes>
    </main>
  )
}

export default App
