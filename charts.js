// Chart.js Configuration for Alexis' Sports Photography Portfolio
// Dark Mode Optimized

// Wait for DOM and Chart.js to load
document.addEventListener('DOMContentLoaded', async function () {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }

    // Load stats data from API
    let statsData;
    try {
        const res = await fetch('/stats_data.json?v=' + new Date().getTime());
        if (!res.ok) throw new Error('Failed to load stats data');
        statsData = await res.json();
    } catch (err) {
        console.warn('Error loading stats data, using defaults:', err);
        // Fallback to default data (Updated with correct values)
        statsData = {
            competitionDistribution: {
                labels: ['National 1', 'National 3', 'Coupe de France', 'U19 / Autres'],
                values: [10, 7, 5, 7]
            },
            seasonEvolution: {
                labels: ['Août', 'Sept', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mars', 'Avr', 'Mai'],
                values: [1, 3, 2, 4, 0, 3, 3, 0, 0, 0]
            },
            photoTypes: {
                labels: ['Action de jeu', 'Portraits joueurs', 'Ambiance', 'Célébrations'],
                values: [60, 20, 10, 10]
            }
        };
    }

    // Calculate dynamic total matches
    const totalMatches = statsData.competitionDistribution.values.reduce((a, b) => a + b, 0);

    const totalCard = document.getElementById('total-matches-card');
    if (totalCard) {
        totalCard.innerHTML = `${totalMatches} MATCHS`;
    }

    const totalNote = document.getElementById('total-matches-note');
    if (totalNote) {
        totalNote.innerHTML = `Total de ${totalMatches} matchs officiels couverts`;
    }

    // Global Chart.js defaults for dark mode
    Chart.defaults.color = '#ccc';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    Chart.defaults.font.family = "'Montserrat', sans-serif";

    // Primary color from the design
    const primaryColor = '#e94560';
    const secondaryColor = '#00ff41';

    // Competition Distribution Chart (Bar Chart)
    const competitionCtx = document.getElementById('competitionChart');
    if (competitionCtx) {
        new Chart(competitionCtx, {
            type: 'bar',
            data: {
                labels: statsData.competitionDistribution.labels,
                datasets: [{
                    label: 'Matchs Couverts',
                    data: statsData.competitionDistribution.values,
                    backgroundColor: [
                        'rgba(233, 69, 96, 0.8)',
                        'rgba(233, 69, 96, 0.6)',
                        'rgba(233, 69, 96, 0.4)',
                        'rgba(233, 69, 96, 0.2)'
                    ],
                    borderColor: primaryColor,
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 10, 10, 0.9)',
                        titleColor: primaryColor,
                        bodyColor: '#fff',
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                return context.parsed.y + ' matchs';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: '#888'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ccc',
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    // Evolution Chart (Line Chart)
    const evolutionCtx = document.getElementById('evolutionChart');
    if (evolutionCtx) {
        new Chart(evolutionCtx, {
            type: 'line',
            data: {
                labels: statsData.seasonEvolution.labels,
                datasets: [{
                    label: 'Matchs par mois',
                    data: statsData.seasonEvolution.values,
                    borderColor: primaryColor,
                    backgroundColor: 'rgba(233, 69, 96, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 10, 10, 0.9)',
                        titleColor: primaryColor,
                        bodyColor: '#fff',
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                return context.parsed.y + ' matchs couverts';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 2,
                            color: '#888'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ccc'
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart',
                    delay: 300
                }
            }
        });
    }

    // Photo Types Chart (Doughnut Chart)
    const photoTypesCtx = document.getElementById('photoTypesChart');
    if (photoTypesCtx) {
        new Chart(photoTypesCtx, {
            type: 'doughnut',
            data: {
                labels: statsData.photoTypes.labels,
                datasets: [{
                    data: statsData.photoTypes.values,
                    backgroundColor: [
                        'rgba(233, 69, 96, 0.9)',
                        'rgba(233, 69, 96, 0.6)',
                        'rgba(233, 69, 96, 0.3)',
                        'rgba(0, 255, 65, 0.5)'
                    ],
                    borderColor: '#0a0a0a',
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ccc',
                            padding: 15,
                            font: {
                                size: 11
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 10, 10, 0.9)',
                        titleColor: primaryColor,
                        bodyColor: '#fff',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                },
                cutout: '65%',
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1500,
                    easing: 'easeInOutQuart',
                    delay: 600
                }
            }
        });
    }

    // Animate charts when scrolling into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.2
    });

    document.querySelectorAll('.chart-container').forEach(container => {
        container.style.opacity = '0';
        container.style.transform = 'translateY(30px)';
        container.style.transition = 'all 0.8s ease';
        observer.observe(container);
    });
});
