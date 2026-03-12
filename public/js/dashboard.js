new Chart(document.getElementById('revenueChart'), {
  type: 'bar',
  data: {
    labels: orderLabels,
    datasets: [{
      label: 'Revenue (₹)',
      data: orderPrices
    }]
  }
});

new Chart(document.getElementById('profitChart'), {
  type: 'doughnut',
  data: {
    labels: ['Cost', 'Profit'],
    datasets: [{
      data: [estimatedCost, profit]
    }]
  }
});
