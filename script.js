document.addEventListener('DOMContentLoaded', () => {
    const titleInput = document.getElementById('activity-title');
    const cardInput = document.getElementById('activity-card');
    const clientInput = document.getElementById('activity-client');
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const exportButton = document.getElementById('export-button');
    const activityDisplay = document.getElementById('activity-display');
    const darkModeButton = document.getElementById('dark-mode-btn');
    const tableBody = document.querySelector('#activity-table tbody');
    const totalTimeCell = document.getElementById('total-time');
    const modal = document.getElementById('description-modal');
    const descriptionInput = document.getElementById('activity-description');
    const saveDescriptionButton = document.getElementById('save-description-button');
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');

    let timerInterval; // Armazena o intervalo do cronômetro
    let startTime; // Armazena o horário de início
    let elapsedTime = 0; // Armazena o tempo decorrido
    let pendingActivity = null; // Dados temporários da atividade enquanto espera pela descrição

    // Validação dos campos obrigatórios
    function validateInputs() {
        startButton.disabled = !(titleInput.value.trim() && clientInput.value.trim());
    }

    // Formatar tempo em HH:MM:SS
    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    // Atualizar o título da aba do navegador
    function updateTabTitle(time) {
        document.title = `${formatTime(time)}`;
    }

    // Redefinir o título da aba
    function resetTabTitle() {
        document.title = "Gerenciador de Atividades";
    }

    // Atualizar o total de horas
    function updateTotalTime() {
        let totalMilliseconds = 0;
        tableBody.querySelectorAll('tr').forEach(row => {
            const timeCell = row.children[6];
            const [hours, minutes, seconds] = timeCell.textContent.split(':').map(Number);
            totalMilliseconds += (hours * 3600 + minutes * 60 + seconds) * 1000;
        });
        totalTimeCell.textContent = formatTime(totalMilliseconds);
    }

    // Adicionar linha à tabela
    function addRowToTable(title, card, client, start, end, total, description) {
        const date = new Date().toLocaleDateString();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${date}</td>
            <td>${title}</td>
            <td>${client}</td>
            <td>${card || '-'}</td>
            <td>${start}</td>
            <td>${end}</td>
            <td>${total}</td>
            <td>${description}</td>
        `;
        tableBody.appendChild(row);
        updateTotalTime(); // Atualiza o total de horas ao adicionar nova linha
    }

    // Iniciar cronômetro
    startButton.addEventListener('click', () => {
        startTime = Date.now(); // Armazena o horário de início
        elapsedTime = 0; // Reseta o tempo decorrido
        activityDisplay.classList.add('running'); // Adiciona estilo verde
        activityDisplay.textContent = `Iniciando Atividade: 00:00:00`;

        timerInterval = setInterval(() => {
            if (startTime && Date.now() > startTime) { // Verifica se o tempo é válido
                const elapsed = Date.now() - startTime;
                activityDisplay.textContent = `${titleInput.value}: ${formatTime(elapsed)}`;
                updateTabTitle(elapsed); // Atualiza o título da aba
            }
        }, 1000);

        startButton.disabled = true;
        pauseButton.disabled = false;
    });

    // Parar cronômetro e exibir modal
    pauseButton.addEventListener('click', () => {
        clearInterval(timerInterval); // Interrompe o cronômetro
        const endTime = new Date(); // Marca o horário de término
        const elapsed = Date.now() - startTime; // Calcula o tempo total

        pendingActivity = {
            title: titleInput.value.trim(),
            card: cardInput.value.trim(),
            client: clientInput.value.trim(),
            startFormatted: new Date(startTime).toLocaleTimeString(),
            endFormatted: endTime.toLocaleTimeString(),
            elapsed
        };

        resetTabTitle(); // Redefine o título da aba
        modal.style.display = 'flex'; // Exibe o modal para a descrição
    });

    // Salvar descrição e adicionar atividade à tabela
    saveDescriptionButton.addEventListener('click', () => {
        if (!pendingActivity) return;

        const description = descriptionInput.value.trim() || '-';
        addRowToTable(
            pendingActivity.title,
            pendingActivity.card,
            pendingActivity.client,
            pendingActivity.startFormatted,
            pendingActivity.endFormatted,
            formatTime(pendingActivity.elapsed),
            description
        );

        // Fecha o modal e reseta os campos
        modal.style.display = 'none';
        descriptionInput.value = '';
        pendingActivity = null;

        // Reseta o estado
        activityDisplay.classList.remove('running');
        activityDisplay.textContent = "Nenhuma atividade em andamento";
        resetTabTitle(); // Reseta o título da aba
        startButton.disabled = false;
        pauseButton.disabled = true;
        titleInput.value = '';
        clientInput.value = '';
        cardInput.value = '';
    });

    // Exportar para CSV
    exportButton.addEventListener('click', () => {
        const rows = [['Data', 'Atividade', 'Cliente', 'Card', 'Início', 'Fim', 'Tempo Total', 'Descrição']];
        tableBody.querySelectorAll('tr').forEach(row => {
            const cells = Array.from(row.children).map(cell => `"${cell.textContent.replace(/"/g, '""')}"`);
            rows.push(cells);
        });
    
        const csvContent = rows.map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
    
        // Função para formatar a data no formato "dia-mes"
        function getFormattedDate() {
            const date = new Date();
            const day = String(date.getDate()).padStart(2, '0'); // Dia com dois dígitos
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês com dois dígitos
            return `${day}-${month}`;
        }
    
        // Adiciona a data ao nome do arquivo
        link.setAttribute('download', `atividades-${getFormattedDate()}.csv`);
        link.click();
    });

    // Define o modo escuro como padrão
    document.body.classList.add('dark-mode');
    darkModeButton.textContent = 'Nutela Mode'; // Define o texto do botão

    // Alternar Modo Escuro
    darkModeButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        darkModeButton.textContent = document.body.classList.contains('dark-mode') ? 'Nutela Mode' : 'Dark Mode';
    });

    // Validar inputs em tempo real
    titleInput.addEventListener('input', validateInputs);
    clientInput.addEventListener('input', validateInputs);

    // Inicializa os botões corretamente
    validateInputs();

    window.addEventListener('beforeunload', () => {
    clearInterval(timerInterval); // Limpa o intervalo ao recarregar/fechar a página
    });

    //Atividades do dia.       
    
    // Função para salvar tarefas no localStorage
    function saveTasks() {
        const tasks = [];
        taskList.querySelectorAll('li').forEach(li => {
            tasks.push({
                text: li.querySelector('span').textContent,
                completed: li.querySelector('input').checked
            });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Função para carregar tarefas do localStorage
    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => {
            const li = document.createElement('li');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => {
                li.style.textDecoration = checkbox.checked ? 'line-through' : 'none';
                saveTasks();
            });

            const span = document.createElement('span');
            span.textContent = task.text;
            if (task.completed) {
                li.style.textDecoration = 'line-through';
            }

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X';
            removeBtn.addEventListener('click', () => {
                taskList.removeChild(li);
                saveTasks();
            });

            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(removeBtn);
            taskList.appendChild(li);
        });
    }

    // Carregar tarefas ao iniciar a página
    loadTasks();

    // Adicionar tarefa
    addTaskBtn.addEventListener('click', () => {
        const taskText = taskInput.value.trim();
        if (taskText) {
            const li = document.createElement('li');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.addEventListener('change', () => {
                li.style.textDecoration = checkbox.checked ? 'line-through' : 'none';
                saveTasks();
            });

            const span = document.createElement('span');
            span.textContent = taskText;

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X';
            removeBtn.addEventListener('click', () => {
                taskList.removeChild(li);
                saveTasks();
            });

            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(removeBtn);
            taskList.appendChild(li);

            taskInput.value = '';
            saveTasks();
        }
    });

    // Adicionar tarefa ao pressionar Enter
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTaskBtn.click();
        }
    });
});
