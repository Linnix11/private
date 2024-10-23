
const API_URL = 'http://localhost:3000';

async function fetchItems() {
    const loadingElement = document.getElementById('loading');
    const menuContainer = document.getElementById('menu');

  
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    try {
        
        loadingElement.style.display = 'block';
        menuContainer.innerHTML = '';

        const response = await fetch(`${API_URL}/items`);
        
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données');
        }

        const items = await response.json();
        
       
        loadingElement.style.display = 'none';
        
        if (!items || items.length === 0) {
            menuContainer.innerHTML = '<div class="no-items">Aucun article disponible</div>';
            return;
        }

        displayItems(items);
    } catch (error) {
        loadingElement.style.display = 'none';
        showError("Erreur lors du chargement des articles");
        console.error('Erreur:', error);
    }
}

function displayItems(items) {
    const menuContainer = document.getElementById('menu');
    
  
    menuContainer.innerHTML = '';

    items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        itemCard.innerHTML = `
            <button class="delete-btn" onclick="deleteItem(${item.id}, this)">×</button>
            <div class="item-name">${item.name || 'Sans nom'}</div>
            <div class="item-description">${item.description || 'Aucune description disponible'}</div>
            <div class="item-price">${item.price ? item.price.toFixed(2) + ' €' : 'Prix non disponible'}</div>
        `;
        menuContainer.appendChild(itemCard);
    });
}


window.deleteItem = async function(itemId, buttonElement) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
        return;
    }

    const itemCard = buttonElement.closest('.item-card');
    
    try {
   
        itemCard.style.opacity = '0.5';
        buttonElement.disabled = true;

        const response = await fetch(`${API_URL}/items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
           
            itemCard.classList.add('removing');
            
            setTimeout(() => {
                itemCard.remove();
                showSuccessMessage(data.message || "Article supprimé avec succès");
            }, 500);
        } else {
        
            itemCard.style.opacity = '1';
            buttonElement.disabled = false;
            throw new Error(data.message || 'Erreur lors de la suppression');
        }
    } catch (error) {
       
        itemCard.style.opacity = '1';
        buttonElement.disabled = false;
        
        showError(error.message || "Erreur lors de la suppression de l'article");
        console.error('Erreur:', error);
    }
}

function showError(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'error-message';
    messageElement.textContent = message;
    
    setTimeout(() => messageElement.remove(), 3000);
    
    document.querySelector('.container').insertBefore(messageElement, document.getElementById('menu'));
}

function showSuccessMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'success-message';
    messageElement.textContent = message;
    
    setTimeout(() => messageElement.remove(), 3000);
    
    document.querySelector('.container').insertBefore(messageElement, document.getElementById('menu'));
}

// Init //
document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
       
        setTimeout(fetchItems, 100);
    }
});