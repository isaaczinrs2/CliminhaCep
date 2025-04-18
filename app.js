document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const cepInput = document.getElementById('CEP');
    const searchBtn = document.getElementById('searchBtn');
    const locationBtn = document.getElementById('locationBtn');
    const themeToggle = document.getElementById('themeToggle');
    const weatherContainer = document.querySelector('.weather-container');
    const currentWeather = document.querySelector('.current-weather:not(.loading)');
    const loadingSkeleton = document.querySelector('.current-weather.loading');
    const notification = document.getElementById('notification');
    const connectionStatus = document.getElementById('connection-status');
    
    // Variáveis globais
    let weatherData = null;
    let temperatureChart = null;
    
    // Inicialização
    initApp();
    
    function initApp() {
        // Configurar ano atual no footer
        document.getElementById('current-year').textContent = new Date().getFullYear();
        
        // Verificar conexão
        checkConnection();

        setInterval(checkConnection, 30000);
        
        // Event Listeners
        searchBtn.addEventListener('click', handleSearch);
        locationBtn.addEventListener('click', handleLocation);
        themeToggle.addEventListener('change', toggleTheme);
        cepInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleSearch();
        });
        
        // Formatar CEP enquanto digita
        cepInput.addEventListener('input', formatCEP);
        
        // Verificar tema preferido do usuário
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            themeToggle.checked = true;
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        
        // Carregar último CEP pesquisado (se existir)
        const lastCEP = localStorage.getItem('lastCEP');
        if (lastCEP) {
            cepInput.value = lastCEP;
        }
    }
    
    // Formatar CEP (adicionar hífen)
    function formatCEP() {
        let value = cepInput.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        cepInput.value = value;
    }
    
    // Verificar status da conexão
    function checkConnection() {
        connectionStatus.textContent = 'Verificando conexão...';
        connectionStatus.parentElement.className = 'api-status connecting';
        
        if (navigator.onLine) {
            fetch('https://api.openweathermap.org/data/2.5/weather?q=London&appid=0c973965f7fbf585c72b9b9ba904a9dc', { 
                method: 'HEAD',
                cache: 'no-cache'
            })
            .then(() => {
                connectionStatus.textContent = 'Conectado';
                connectionStatus.parentElement.className = 'api-status connected';
            })
            .catch(() => {
                connectionStatus.textContent = 'Erro na conexão';
                connectionStatus.parentElement.className = 'api-status error';
            });
        } else {
            connectionStatus.textContent = 'Offline';
            connectionStatus.parentElement.className = 'api-status error';
            showNotification('Você está offline. Algumas funcionalidades podem não estar disponíveis.', 'warning');
        }
    }
    
    // Mostrar notificação
    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        // Adicionar ícone conforme o tipo
        const icon = type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'check-circle';
        notification.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
        
        notification.classList.add('show');
        
        // Esconder após 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    // Alternar tema claro/escuro
    function toggleTheme() {
        const isDark = themeToggle.checked;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Animação suave
        gsap.to('body', {
            backgroundColor: isDark ? '#121212' : '#f8f9fa',
            duration: 0.5,
            ease: 'power2.inOut'
        });
    }
    
    // Manipular busca por CEP
    async function handleSearch() {
        document.querySelector('.weather-container').classList.add('active');

        const cep = cepInput.value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            showNotification('Por favor, digite um CEP válido com 8 dígitos.', 'error');
            cepInput.focus();
            return;
        }
        
        // Mostrar skeleton loading
        document.querySelector('.weather-container').classList.remove('hidden');
        document.querySelector('.current-weather.loading').classList.remove('hidden');
        weatherContainer.style.opacity = '1';
        
        try {
            // Buscar informações do CEP
            const cepData = await fetchCEP(cep);
            
            // Buscar informações do clima
            weatherData = await fetchWeather(cepData.localidade, cepData.uf);
            
            // Atualizar UI
            updateUI(cepData, weatherData);
            
            // Salvar CEP no localStorage
            localStorage.setItem('lastCEP', cepInput.value);
            
            // Mostrar notificação de sucesso
            showNotification('Informações atualizadas com sucesso!');

            document.querySelector('.current-weather.loading').classList.add('hidden');
            document.querySelector('.current-weather:not(.loading)').classList.remove('hidden');
            document.querySelector('.forecast-section').classList.remove('hidden');
            document.querySelector('.hourly-forecast').classList.remove('hidden');
            
        } catch (error) {
            console.error('Erro:', error);
            showNotification(error.message || 'Erro ao buscar informações. Tente novamente.', 'error');
            
            // Esconder skeleton loading em caso de erro
            document.querySelector('.weather-container').classList.add('hidden');
        }
    }
    
    // Buscar dados do CEP
    async function fetchCEP(cep) {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            throw new Error('CEP não encontrado. Verifique o número e tente novamente.');
        }
        
        return data;
    }
    
    // Buscar dados do clima e previsão
    async function fetchWeather(city, state) {
        const apiKey = '0c973965f7fbf585c72b9b9ba904a9dc';

        // Clima atual
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},${state},BR&appid=${apiKey}&units=metric&lang=pt`);
        const currentData = await response.json();

        if (currentData.cod !== 200) {
            throw new Error('Erro ao buscar dados do clima. Tente novamente mais tarde.');
        }

        // Previsão de 5 dias
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city},${state},BR&appid=${apiKey}&units=metric&lang=pt`);
        const forecastData = await forecastResponse.json();

        return {
            current: currentData,
            forecast: forecastData
        };
    }
    
    // Atualizar interface com os dados
    function updateUI(cepData, weatherData) {
        // Atualizar dados atuais
        updateCurrentWeather(cepData, weatherData.current);
        
        // Atualizar previsão para 5 dias
        updateForecast(weatherData.forecast);
        
        // Atualizar previsão horária
        updateHourlyForecast(weatherData.forecast);
        
        // Atualizar gráfico de temperatura
        updateTemperatureChart(weatherData.forecast);
        
        // Atualizar background conforme o clima
        updateBackground(weatherData.current.weather[0].main);
        
        // Esconder skeleton e mostrar dados reais
        setTimeout(() => {
            loadingSkeleton.classList.add('hidden');
            currentWeather.classList.remove('hidden');
            
            // Animação de entrada
            gsap.from('.current-weather:not(.loading)', {
                opacity: 0,
                y: 20,
                duration: 0.8,
                ease: 'power2.out'
            });
        }, 500);
        document.querySelector('.weather-container').classList.add('loaded');
    }
    
    // Atualizar clima atual
    function updateCurrentWeather(cepData, currentWeatherData) {
        // Localização
        document.getElementById('cidade-bairro').textContent = 
            `${cepData.localidade}, ${cepData.bairro || cepData.uf}`;
        
        // Data atual formatada
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        document.getElementById('current-date').textContent = 
            new Date().toLocaleDateString('pt-BR', options);
        
        // Temperatura
        const temp = Math.round(currentWeatherData.main.temp);
        document.getElementById('current-temp').textContent = `${temp}°`;
        
        // Sensação térmica
        const feelsLike = Math.round(currentWeatherData.main.feels_like);
        document.getElementById('feels-like').textContent = `Sensação: ${feelsLike}°`;
        
        // Temperatura mínima e máxima
        const tempMin = Math.round(currentWeatherData.main.temp_min);
        const tempMax = Math.round(currentWeatherData.main.temp_max);
        document.getElementById('temp-range').textContent = `Máx ${tempMax}° • Mín ${tempMin}°`;
        
        // Descrição do clima
        const weatherDesc = currentWeatherData.weather[0].description;
        document.getElementById('current-weather-desc').textContent = 
            weatherDesc.charAt(0).toUpperCase() + weatherDesc.slice(1);
        
        // Ícone do clima
        setWeatherIcon(currentWeatherData.weather[0]);
        
        // Detalhes adicionais
        document.getElementById('wind-speed').textContent = 
            `${(currentWeatherData.wind.speed * 3.6).toFixed(1)} km/h`;
        document.getElementById('humidity').textContent = 
            `${currentWeatherData.main.humidity}%`;
        document.getElementById('pressure').textContent = 
            `${currentWeatherData.main.pressure} hPa`;
        document.getElementById('visibility').textContent = 
            `${(currentWeatherData.visibility / 1000).toFixed(1)} km`;
    }
    
    // Definir ícone do clima
    function setWeatherIcon(weather) {
        const iconMap = {
            '01': 'sun',         // clear sky
            '02': 'cloud-sun',    // few clouds
            '03': 'cloud',        // scattered clouds
            '04': 'cloud',        // broken clouds
            '09': 'cloud-rain',   // shower rain
            '10': 'cloud-rain',   // rain
            '11': 'bolt',        // thunderstorm
            '13': 'snowflake',    // snow
            '50': 'smog'         // mist
        };

        const iconCode = weather.icon.substring(0, 2);
        const iconName = iconMap[iconCode] || 'cloud';
        
        // Usando Font Awesome em vez de imagens
        const iconElement = document.createElement('i');
        iconElement.className = `fas fa-${iconName} weather-icon-fa`;
        
        // Animação do ícone
        gsap.from(iconElement, {
            scale: 0,
            rotation: -30,
            duration: 0.8,
            ease: 'elastic.out(1, 0.5)'
        });

        const iconContainer = document.getElementById('current-weather-icon');
        iconContainer.innerHTML = '';
        iconContainer.appendChild(iconElement);
        
        // Adicionar classe para ícones específicos
        if (iconName.includes('sun')) {
            iconContainer.classList.add('sunny');
        } else if (iconName.includes('rain') || iconName.includes('bolt')) {
            iconContainer.classList.add('rainy');
        } else if (iconName.includes('snow')) {
            iconContainer.classList.add('snowy');
        } else {
            iconContainer.classList.remove('sunny', 'rainy', 'snowy');
        }
    }
    
    // Atualizar background conforme o clima
    function updateBackground(weatherMain) {
        const background = document.querySelector('.background-animation');
        
        // Remover todas as classes de clima
        background.className = 'background-animation';
        
        // Adicionar classe específica
        switch(weatherMain.toLowerCase()) {
            case 'clear':
                background.classList.add('clear');
                break;
            case 'clouds':
                background.classList.add('clouds');
                break;
            case 'rain':
            case 'drizzle':
                background.classList.add('rain');
                break;
            case 'thunderstorm':
                background.classList.add('thunderstorm');
                break;
            case 'snow':
                background.classList.add('snow');
                break;
            default:
                background.classList.add('default');
        }
        
        // Animação de transição
        gsap.to(background, {
            opacity: 0.15,
            duration: 1.5,
            ease: 'power2.inOut'
        });
    }
    
    // Atualizar previsão para 5 dias
    function updateForecast(forecastData) {
        const forecastContainer = document.querySelector('.forecast-days');
        forecastContainer.innerHTML = '';
        
        // Agrupar por dia
        const dailyForecast = {};
        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toLocaleDateString('pt-BR', { weekday: 'short' });
            
            if (!dailyForecast[dayKey]) {
                dailyForecast[dayKey] = {
                    temp: [],
                    weather: item.weather[0],
                    date: date
                };
            }
            
            dailyForecast[dayKey].temp.push(item.main.temp);
        });
        
        // Criar cards para cada dia
        Object.keys(dailyForecast).forEach((day, index) => {
            if (index >= 5) return; // Limitar a 5 dias
            
            const dayData = dailyForecast[day];
            const avgTemp = Math.round(dayData.temp.reduce((a, b) => a + b, 0) / dayData.temp.length);
            
            const dayCard = document.createElement('div');
            dayCard.className = 'forecast-day fade-in';
            dayCard.style.animationDelay = `${index * 0.1}s`;
            
            dayCard.innerHTML = `
                <p class="day-name">${index === 0 ? 'Hoje' : dayData.date.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                <i class="fas fa-${getWeatherIconName(dayData.weather)} weather-icon-fa"></i>
                <p class="day-temp">${avgTemp}°</p>
                <p class="day-desc">${dayData.weather.description}</p>
            `;
            
            forecastContainer.appendChild(dayCard);
        });
    }
    
    // Atualizar previsão horária
    function updateHourlyForecast(forecastData) {
        const hourlyContainer = document.querySelector('.hourly-scroll');
        hourlyContainer.innerHTML = '';
        
        // Pegar as próximas 12 horas
        const next12Hours = forecastData.list.slice(0, 5);
        
        next12Hours.forEach((hour, index) => {
            const date = new Date(hour.dt * 1000);
            const hourStr = date.getHours() + 'h';
            const temp = Math.round(hour.main.temp);
            
            const hourItem = document.createElement('div');
            hourItem.className = 'hourly-item fade-in';
            hourItem.style.animationDelay = `${index * 0.1}s`;
            
            hourItem.innerHTML = `
                <p class="hour-time">${hourStr}</p>
                <i class="fas fa-${getWeatherIconName(hour.weather[0])} weather-icon-fa"></i>
                <p class="hour-temp">${temp}°</p>
            `;
            
            hourlyContainer.appendChild(hourItem);
        });
    }
    
    // Atualizar gráfico de temperatura
    function updateTemperatureChart(forecastData) {
        const ctx = document.getElementById('temperatureChart').getContext('2d');
        
        // Destruir gráfico anterior se existir
        if (temperatureChart) {
            temperatureChart.destroy();
        }
        
        // Preparar dados
        const labels = [];
        const temps = [];
        const feelsLike = [];
        
        forecastData.list.slice(0, 8).forEach(item => {
            const date = new Date(item.dt * 1000);
            labels.push(date.getHours() + 'h');
            temps.push(item.main.temp);
            feelsLike.push(item.main.feels_like);
        });
        
        // Criar novo gráfico
        temperatureChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Temperatura (°C)',
                        data: temps,
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Sensação Térmica (°C)',
                        data: feelsLike,
                        borderColor: '#4cc9f0',
                        backgroundColor: 'rgba(0, 195, 255, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                            font: {
                                family: 'Roboto, sans-serif'
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
    
    // Obter nome do ícone para Font Awesome
    function getWeatherIconName(weather) {
        const iconMap = {
            '01': 'sun',         // clear sky
            '02': 'cloud-sun',   // few clouds
            '03': 'cloud',       // scattered clouds
            '04': 'cloud',       // broken clouds
            '09': 'cloud-rain',  // shower rain
            '10': 'cloud-rain',  // rain
            '11': 'bolt',        // thunderstorm
            '13': 'snowflake',   // snow
            '50': 'smog'        // mist
        };

        const iconCode = weather.icon.substring(0, 2);
        return iconMap[iconCode] || 'cloud';
    }
    
    // Usar geolocalização
    function handleLocation() {
        if (!navigator.geolocation) {
            showNotification('Geolocalização não é suportada pelo seu navegador.', 'warning');
            return;
        }
        
        showNotification('Obtendo sua localização...', 'warning');
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    // Mostrar skeleton loading
                    loadingSkeleton.classList.remove('hidden');
                    currentWeather.classList.add('hidden');
                    
                    // Buscar cidade pelas coordenadas
                    const apiKey = '0c973965f7fbf585c72b9b9ba904a9dc';
                    const response = await fetch(
                        `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${apiKey}`
                    );
                    const data = await response.json();
                    
                    if (data.cod !== 200) {
                        throw new Error('Localização não encontrada.');
                    }
                    
                    // Atualizar CEP input com valor aproximado (opcional)
                    cepInput.value = '00000000';
                    cepInput.placeholder = 'Localização aproximada';
                    
                    // Buscar dados completos do clima
                    weatherData = await fetchWeather(data.name, data.sys.country);
                    
                    // Atualizar UI
                    updateUI({
                        localidade: data.name,
                        uf: data.sys.country,
                        bairro: 'Sua localização atual'
                    }, weatherData);
                    
                    showNotification('Localização encontrada com sucesso!');
                    
                } catch (error) {
                    console.error('Erro:', error);
                    showNotification('Erro ao obter localização. Tente novamente.', 'error');
                    loadingSkeleton.classList.add('hidden');
                }
            },
            (error) => {
                let errorMessage;
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Permissão de localização negada.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Informações de localização indisponíveis.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "A requisição de localização expirou.";
                        break;
                    default:
                        errorMessage = "Erro desconhecido ao obter localização.";
                }
                showNotification(errorMessage, 'error');
            }
        );
    }
    
    // Atualizar hora a cada minuto
    setInterval(() => {
        if (document.getElementById('current-date')) {
            const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
            document.getElementById('current-date').textContent = 
                new Date().toLocaleDateString('pt-BR', options);
        }
    }, 60000);
}); 