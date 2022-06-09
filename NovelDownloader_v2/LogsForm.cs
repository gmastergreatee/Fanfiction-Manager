using System;
using System.Data;
using System.Linq;
using System.Text;
using System.Drawing;
using System.Windows.Forms;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace NovelDownloader_v2
{
    public partial class LogsForm : FormWrapper
    {
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
                    if (!string.IsNullOrWhiteSpace(txtConsole.SelectedText))
                    {
                        Clipboard.SetText(txtConsole.SelectedText);
                    }
                }),
                new MenuItem("Clear", (sender, e) =>
                {
                    txtConsole.Clear();
                }),
            });
        }

        public void AppendText(string text)
        {
            var now = DateTime.Now.ToString("[yyyy-MM-dd HH:mm:ss] ");
            if (IsHandleCreated)
            {
                Invoke(new Action(() =>
                {
                    txtConsole.AppendText(now + text + Environment.NewLine);
                }));
            }
            else if (!txtConsole.IsDisposed)
            {
                txtConsole.AppendText(now + text + Environment.NewLine);
            }
        }
    }
}
