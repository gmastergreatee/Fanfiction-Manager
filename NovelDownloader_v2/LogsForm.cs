using System;
using System.Data;
using System.Linq;
using System.Text;
using System.Drawing;
using System.Windows.Forms;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Collections.Generic;
using NovelDownloader_v2.FormInterfaces;

namespace NovelDownloader_v2
{
    public partial class LogsForm : Form, ILogForm
    {
        #region EventHandlers
        public event EventHandler OnCloseClick;
        #endregion

        public LogsForm()
        {
            InitializeComponent();
            txtConsole.ContextMenu = new ContextMenu(new MenuItem[]
            {
                new MenuItem("Select All", (sender, e) =>
                {
                    txtConsole.SelectAll();
                }),
                new MenuItem("Copy", (sender, e) =>
                {
                    Clipboard.SetText(txtConsole.SelectedText);
                }),
                new MenuItem("Clear", (sender, e) =>
                {
                    txtConsole.Clear();
                }),
            });
        }

        private void Logs_FormClosing(object sender, FormClosingEventArgs e)
        {
            OnCloseClick?.Invoke(sender, e);
            e.Cancel = true;
            Hide();
        }

        public void AppendText(string text)
        {
            Invoke(new Action(() =>
            {
                txtConsole.AppendText(text + Environment.NewLine);
            }));
        }
    }
}
