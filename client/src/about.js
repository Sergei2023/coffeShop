import './styles/style.css';
import './styles/about.css';

document.addEventListener('DOMContentLoaded', function() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = stat.getAttribute('data-count');
        const isMillions = stat.nextElementSibling.textContent.includes('миллион');
        
        if (isMillions) {
            stat.textContent = target + 'M';
        } else {
            stat.textContent = target;
        }
    });
});