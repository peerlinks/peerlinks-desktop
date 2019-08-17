import React from 'react';
import './App.css';

function App() {
  return (
    <div className='app'>
      <aside className='sidebar'>
        <h6 className='title'>channels:</h6>
        <ul>
          <li>c1</li>
          <li>c2</li>
          <li>c3</li>
        </ul>
      </aside>

      <div className='main'>
        <div className='main-container'>
          <header className='channel-info'>
            Information
          </header>
          <section className='channel-messages'>
            <h1>h1</h1>
            <h2>h2</h2>
            <h3>h3</h3>
            <h4>h4</h4>
            <h5>h5</h5>
            <h6>h6</h6>
          </section>
          <footer className='channel-compose'>
            <input
              className='channel-compose-text'
              type='text'
              placeholder='Write a message'/>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
