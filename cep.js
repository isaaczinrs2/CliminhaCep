window.onload = function() {
    function limpa_formulário_cep() {
        document.getElementById('resultado-cep').textContent = "";
        document.getElementById('clima').innerHTML = "";
        document.getElementById('CEP').value = "";
        document.getElementById('section-rst').style.display = 'none';  // Oculta a section de resultados
    }

    function buscarClima(localidade, uf) {
        const apiKey = '0c973965f7fbf585c72b9b9ba904a9dc';
        const cidade = removeAcentos(localidade).replace(/ /g, '+');
        const estado = uf.toUpperCase();

        const urlClima = `https://api.openweathermap.org/data/2.5/weather?q=${cidade},${estado},BR&units=metric&appid=${apiKey}&lang=pt_br`;

        fetch(urlClima)
            .then(response => response.json())
            .then(data => {
                if (data.cod === 200) {
                    const climaDescricao = data.weather[0].description;
                    const temperatura = data.main.temp;
                    const feelsLike = data.main.feels_like;
                    const vento = data.wind.speed;
                    const umidade = data.main.humidity;
                    const pressao = data.main.pressure;

                    document.getElementById('clima').innerHTML = `
                        <p>${data.name}, ${data.sys.country}</p>
                        <p>${temperatura}°C</p>
                        <p>Sensação térmica: ${feelsLike}°C. ${climaDescricao}.</p>
                        <p>Vento: ${vento}m/s</p>
                        <p>Umidade: ${umidade}%</p>
                        <p>Pressão: ${pressao} hPa</p>
                    `;
                } else {
                    document.getElementById('clima').innerHTML = "<p>Clima não encontrado.</p>";
                }
            })
            .catch(error => {
                document.getElementById('clima').innerHTML = "<p>Erro ao buscar o clima.</p>";
            });
    }

    function removeAcentos(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function pesquisacep() {
        const valor = document.getElementById('CEP').value;
        const cep = valor.replace(/\D/g, '');

        if (cep != "") {
            const validacep = /^[0-9]{8}$/;

            if (validacep.test(cep)) {
                limpa_formulário_cep(); // Limpa qualquer resultado anterior

                fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    .then(response => response.json())
                    .then(data => {
                        if (!("erro" in data)) {
                            document.getElementById('resultado-cep').innerHTML = `
                                <p>Bairro: ${data.bairro}</p>
                                <p>Cidade: ${data.localidade}</p>
                                <p>UF: ${data.uf}</p>
                            `;
                            buscarClima(data.localidade, data.uf);

                            // Mostrar a section rst após a busca
                            document.getElementById('section-rst').style.display = 'flex';
                        } else {
                            limpa_formulário_cep();
                            alert("CEP não encontrado.");
                        }
                    })
                    .catch(error => {
                        console.error("Erro ao buscar o CEP:", error);
                    });
            } else {
                limpa_formulário_cep();
                alert("Formato de CEP inválido.");
            }
        } else {
            limpa_formulário_cep();
        }
    }

    document.getElementById('env').addEventListener('click', async function() {
        const cep = document.getElementById('CEP').value;
    
        if (cep && cep.length === 8) {
            // Chama a API do VIACEP para obter os dados do CEP
            try {
                const responseCep = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const dataCep = await responseCep.json();
                
                if (dataCep.erro) {
                    alert('CEP não encontrado!');
                    return;
                }
                
                // Obtém a cidade, bairro e estado do CEP
                const cidade = dataCep.localidade;
                const bairro = dataCep.bairro;
                const estado = dataCep.uf;
    
                // Atualiza a cidade e o bairro na interface
                document.getElementById('cidade-bairro').innerText = `${cidade}, ${bairro}`;
                
                // Chama a API do OpenWeather para obter os dados do clima
                const apiKey = '0c973965f7fbf585c72b9b9ba904a9dc';  // Coloque aqui sua chave da API do OpenWeather
                const responseClima = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cidade},${estado},BR&appid=${apiKey}&units=metric&lang=pt`);
                const dataClima = await responseClima.json();
    
                // Atualiza o clima na interface
               
// Extraindo os dados de temperatura da API
const temperatura = dataClima.main.temp;
const tempMin = dataClima.main.temp_min; // Temperatura mínima
const tempMax = dataClima.main.temp_max; // Temperatura máxima
const sensClima = dataClima.main.feels_like;
const descricaoClima = dataClima.weather[0].description;
const vento = dataClima.wind.speed;
const umidade = dataClima.main.humidity;
const pressao = dataClima.main.pressure;
const visibilidade = dataClima.visibility ? (dataClima.visibility / 1000).toFixed(1) : 'Indisponível';

// Atualizando os elementos HTML com as informações do clima
document.getElementById('clima-principal').innerText = `${(temperatura)}°C`;
document.getElementById('descricao-clima').innerText = descricaoClima.charAt(0).toUpperCase() + descricaoClima.slice(1);

document.getElementById('SensClima').innerText = `Sensação: ${(sensClima)}°C`;

// Atualizando as temperaturas mínima e máxima
document.getElementById('temp-min-max').innerText = `Máx: ${(tempMax)}°C | Mín: ${(tempMin)}°C`;

// Atualizando as outras informações (vento, umidade, etc.)
document.getElementById('vento').innerHTML = `<img src='img/vento.png' alt='Ícone de Vento' style='width: 40px; height: 40px;'> Vento: ${vento} m/s`;
document.getElementById('umidade').innerHTML = `<img src='img/umidade.png' alt='Ícone de Umidade' style='width: 40px; height: 40px;'> Umidade: ${umidade}%`;
document.getElementById('pressao').innerHTML = `<img src='img/pressao.png' alt='Ícone de Pressão' style='width: 40px; height: 40px;'> Pressão: ${pressao} hPa`;
document.getElementById('visibilidade').innerHTML = `<img src='img/visibilidade.png' alt='Ícone de Visibilidade' style='width: 40px; height: 40px;'> Visibilidade: ${visibilidade} km`;






    
                // Escolher o ícone apropriado baseado na descrição do clima
                const iconeClima = document.getElementById('icone-clima');
                if (descricaoClima.includes('nublado')) {
                    if (descricaoClima.includes('parcialmente')) {
                        iconeClima.src = 'img/parcialmente_nublado.png';
                        iconeClima.alt = "Parcialmente Nublado";
                    } else {
                        iconeClima.src = 'img/nublado.png';
                        iconeClima.alt = "Nublado";
                    }
                } else if (descricaoClima.includes('céu limpo')) {
                    iconeClima.src = 'img/sol.webp';
                    iconeClima.alt = "Céu Limpo";

                } else if (descricaoClima.includes('nuvens')) {
                    iconeClima.src = 'img/nublado.png';
                    iconeClima.alt = 'Nuvens Quebradas'; 
                } else if (descricaoClima.includes('chuva')) {
                    iconeClima.src = 'img/chuva.png';
                    iconeClima.alt = "Chuva";
                }   else if (descricaoClima.includes('chuvisco')) {
                    iconeClima.src = 'img/chuva.png';
                    iconeClima.alt = "Chuva";
                } else if (descricaoClima.includes('tempestade')) {
                    iconeClima.src = 'img/chuva.png';
                    iconeClima.alt = "Tempestade";
                } else if (descricaoClima.includes('neve')) {
                    iconeClima.src = 'img/neve.png';
                    iconeClima.alt = "Neve";
                } else if (descricaoClima.includes('neblina')) {
                    iconeClima.src = 'img/neblina.png';
                    iconeClima.alt = "Neblina";
                } else {
                    iconeClima.src = 'img/padrao.png';
                    iconeClima.alt = "Clima não identificado";
                }
    
                // Mostra a section .rst com as informações
                document.getElementById('section-rst').classList.add('show');
    
            } catch (error) {
                alert('Erro ao buscar informações. Por favor, tente novamente.');
                console.error(error);
            }
        } else {
            alert('Por favor, insira um CEP válido com 8 dígitos.');
        }
    });
    
    
};
