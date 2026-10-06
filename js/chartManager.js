/**
 * FLOWSHIELD–GREYLOOP | Professional Chart Manager
 * HTML5 Canvas stream graphs with SCADA styling, dynamic gradient fills,
 * and multi-view canvas support.
 */

(function (window) {
  'use strict';

  function drawFlowChart(canvasId, history) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.parentElement) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 300;
    const h = canvas.height = canvas.parentElement.clientHeight || 150;

    ctx.clearRect(0, 0, w, h);

    // Subtle Grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let y = 25; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(38, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }

    const data = history ? history.flowRate : null;
    if (!data || data.length === 0) return;

    const minVal = 0;
    const maxVal = 10;
    const paddingLeft = 40;
    const paddingBottom = 22;
    const chartW = w - paddingLeft - 15;
    const chartH = h - paddingBottom - 15;

    // Y Axis Labels
    ctx.fillStyle = '#64748B';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('8 L/m', paddingLeft - 8, 30);
    ctx.fillText('4 L/m', paddingLeft - 8, 30 + chartH / 2);
    ctx.fillText('0 L/m', paddingLeft - 8, h - paddingBottom);

    const stepX = chartW / (data.length - 1);

    // Area Fill
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = paddingLeft + i * stepX;
      const y = h - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(paddingLeft + chartW, h - paddingBottom);
    ctx.lineTo(paddingLeft, h - paddingBottom);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(14, 165, 233, 0.3)');
    grad.addColorStop(1, 'rgba(14, 165, 233, 0.02)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Data Line
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = paddingLeft + i * stepX;
      const y = h - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Point on latest value
    const lastX = paddingLeft + (data.length - 1) * stepX;
    const lastY = h - paddingBottom - ((data[data.length - 1] - minVal) / (maxVal - minVal)) * chartH;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawLevelChart(canvasId, history) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.parentElement) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 300;
    const h = canvas.height = canvas.parentElement.clientHeight || 150;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let y = 25; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(38, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }

    const data = history ? history.waterLevel : null;
    if (!data || data.length === 0) return;

    const minVal = 0;
    const maxVal = 100;
    const paddingLeft = 40;
    const paddingBottom = 22;
    const chartW = w - paddingLeft - 15;
    const chartH = h - paddingBottom - 15;

    // Y Axis Labels
    ctx.fillStyle = '#64748B';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('100%', paddingLeft - 8, 30);
    ctx.fillText('50%', paddingLeft - 8, 30 + chartH / 2);
    ctx.fillText('0%', paddingLeft - 8, h - paddingBottom);

    const stepX = chartW / (data.length - 1);

    // Area Fill
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = paddingLeft + i * stepX;
      const y = h - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(paddingLeft + chartW, h - paddingBottom);
    ctx.lineTo(paddingLeft, h - paddingBottom);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
    grad.addColorStop(1, 'rgba(37, 99, 235, 0.02)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Data Line
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = paddingLeft + i * stepX;
      const y = h - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Point on latest value
    const lastX = paddingLeft + (data.length - 1) * stepX;
    const lastY = h - paddingBottom - ((data[data.length - 1] - minVal) / (maxVal - minVal)) * chartH;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#2563EB';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawMoistureChart(canvasId, history) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.parentElement) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 300;
    const h = canvas.height = canvas.parentElement.clientHeight || 150;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let y = 25; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(38, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }

    const data = history ? history.soilMoisture : null;
    if (!data || data.length === 0) return;

    const minVal = 0;
    const maxVal = 100;
    const paddingLeft = 40;
    const paddingBottom = 22;
    const chartW = w - paddingLeft - 15;
    const chartH = h - paddingBottom - 15;

    // Y Axis Labels
    ctx.fillStyle = '#64748B';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('100%', paddingLeft - 8, 30);
    ctx.fillText('85% Sat', paddingLeft - 8, 30 + chartH * 0.15);
    ctx.fillText('0%', paddingLeft - 8, h - paddingBottom);

    // Red zone line for 85% saturation threshold
    const satY = h - paddingBottom - (85 / 100) * chartH;
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, satY);
    ctx.lineTo(w - 10, satY);
    ctx.stroke();
    ctx.setLineDash([]);

    const stepX = chartW / (data.length - 1);

    // Area Fill
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = paddingLeft + i * stepX;
      const y = h - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(paddingLeft + chartW, h - paddingBottom);
    ctx.lineTo(paddingLeft, h - paddingBottom);
    ctx.closePath();

    const isHigh = data[data.length - 1] > 80;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, isHigh ? 'rgba(220, 38, 38, 0.3)' : 'rgba(22, 163, 74, 0.25)');
    grad.addColorStop(1, 'rgba(22, 163, 74, 0.02)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Data Line
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = paddingLeft + i * stepX;
      const y = h - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = isHigh ? '#DC2626' : '#16A34A';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Point on latest value
    const lastX = paddingLeft + (data.length - 1) * stepX;
    const lastY = h - paddingBottom - ((data[data.length - 1] - minVal) / (maxVal - minVal)) * chartH;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = isHigh ? '#DC2626' : '#16A34A';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  window.ChartManager = {
    drawFlowChart,
    drawLevelChart,
    drawMoistureChart
  };

})(window);
