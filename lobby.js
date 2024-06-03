function createRoom() {
    const roomId = document.getElementById('room-id').value;
    if (roomId) {
      window.location.href = `game.html?room=${roomId}&action=create`;
    }
  }
  
  function joinRoom() {
    const roomId = document.getElementById('room-id').value;
    if (roomId) {
      window.location.href = `game.html?room=${roomId}&action=join`;
    }
  }
  